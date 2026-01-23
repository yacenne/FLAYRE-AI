"""
Frame Processor Service
Handles incoming frames from the extension and stitches them together
"""

import asyncio
import base64
import io
import logging
import os
import uuid
from pathlib import Path
from typing import List, Dict, Any, Optional
import numpy as np
import cv2
from PIL import Image

logger = logging.getLogger(__name__)

# Storage path for frames
FRAMES_DIR = Path("storage/frames")
STITCHED_DIR = Path("storage/stitched")
TILES_DIR = Path("storage/tiles")

# Ensure directories exist
FRAMES_DIR.mkdir(parents=True, exist_ok=True)
STITCHED_DIR.mkdir(parents=True, exist_ok=True)
TILES_DIR.mkdir(parents=True, exist_ok=True)


class CaptureSession:
    """Manages a single capture session"""
    
    def __init__(self, session_id: str):
        self.session_id = session_id
        self.frames: List[Dict[str, Any]] = []
        self.metadata: Dict[str, Any] = {}
        self.session_dir = FRAMES_DIR / session_id
        self.session_dir.mkdir(exist_ok=True)
        
    def add_frame(self, frame_data: Dict[str, Any]) -> str:
        """Add a frame to the session"""
        frame_number = frame_data['frame_number']
        image_base64 = frame_data['image_base64']
        
        # Decode and save frame
        image_bytes = base64.b64decode(image_base64)
        frame_path = self.session_dir / f"frame_{frame_number:04d}.png"
        
        with open(frame_path, 'wb') as f:
            f.write(image_bytes)
        
        # Store metadata
        frame_info = {
            'frame_number': frame_number,
            'path': str(frame_path),
            'scroll_position': frame_data.get('scroll_position', 0),
            'viewport_height': frame_data.get('viewport_height', 0),
            'timestamp': frame_data.get('timestamp', 0)
        }
        self.frames.append(frame_info)
        
        logger.info(f"Session {self.session_id}: Added frame {frame_number}")
        return str(frame_path)


class FrameStitcher:
    """Stitches frames together using OpenCV feature matching"""
    
    def __init__(self):
        # Feature detector
        self.orb = cv2.ORB_create(nfeatures=1000)
        # Matcher
        self.bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
    
    def load_image(self, path: str) -> np.ndarray:
        """Load image from path"""
        return cv2.imread(path)
    
    def find_overlap(self, img1: np.ndarray, img2: np.ndarray) -> int:
        """
        Find the overlap between two consecutive images.
        Returns the y-offset where img2 should be placed relative to img1.
        """
        height1 = img1.shape[0]
        height2 = img2.shape[0]
        
        # Look at bottom 30% of img1 and top 30% of img2
        overlap_region = int(min(height1, height2) * 0.3)
        
        roi1 = img1[-overlap_region:, :]
        roi2 = img2[:overlap_region, :]
        
        # Convert to grayscale
        gray1 = cv2.cvtColor(roi1, cv2.COLOR_BGR2GRAY)
        gray2 = cv2.cvtColor(roi2, cv2.COLOR_BGR2GRAY)
        
        # Find keypoints and descriptors
        kp1, des1 = self.orb.detectAndCompute(gray1, None)
        kp2, des2 = self.orb.detectAndCompute(gray2, None)
        
        if des1 is None or des2 is None or len(des1) < 2 or len(des2) < 2:
            # Fallback: assume 20% overlap
            return int(height1 * 0.8)
        
        # Match features
        matches = self.bf.match(des1, des2)
        matches = sorted(matches, key=lambda x: x.distance)
        
        if len(matches) < 4:
            return int(height1 * 0.8)
        
        # Get matched keypoint coordinates
        pts1 = np.float32([kp1[m.queryIdx].pt for m in matches[:20]])
        pts2 = np.float32([kp2[m.trainIdx].pt for m in matches[:20]])
        
        # Calculate average y-offset
        y_offsets = pts1[:, 1] - pts2[:, 1]
        avg_offset = np.median(y_offsets)
        
        # Calculate where img2 should start (relative to img1's top)
        stitch_y = height1 - overlap_region + int(avg_offset)
        
        # Sanity check
        if stitch_y < height1 * 0.5:
            stitch_y = int(height1 * 0.8)
        elif stitch_y > height1:
            stitch_y = height1
            
        return stitch_y
    
    def stitch_frames(self, frame_paths: List[str], output_path: str) -> str:
        """
        Stitch multiple frames into a single image.
        Returns path to stitched image.
        """
        if not frame_paths:
            raise ValueError("No frames to stitch")
        
        if len(frame_paths) == 1:
            # Just copy single frame
            import shutil
            shutil.copy(frame_paths[0], output_path)
            return output_path
        
        logger.info(f"Stitching {len(frame_paths)} frames...")
        
        # Load first image
        images = [self.load_image(frame_paths[0])]
        stitch_points = [0]  # Y positions where each image starts
        
        current_height = images[0].shape[0]
        
        # Process remaining images
        for i in range(1, len(frame_paths)):
            img = self.load_image(frame_paths[i])
            
            # Find overlap with previous image
            offset = self.find_overlap(images[-1], img)
            stitch_points.append(stitch_points[-1] + offset)
            current_height = stitch_points[-1] + img.shape[0]
            
            images.append(img)
            
            if i % 10 == 0:
                logger.info(f"Processed {i}/{len(frame_paths)} frames")
        
        # Create output canvas
        width = max(img.shape[1] for img in images)
        total_height = current_height
        
        logger.info(f"Creating canvas: {width}x{total_height}")
        
        # For very large images, use memory-mapped file
        if total_height > 30000:
            return self._stitch_large(images, stitch_points, width, total_height, output_path)
        
        canvas = np.zeros((total_height, width, 3), dtype=np.uint8)
        
        # Place images
        for i, (img, y_start) in enumerate(zip(images, stitch_points)):
            h, w = img.shape[:2]
            y_end = min(y_start + h, total_height)
            actual_h = y_end - y_start
            
            # Blend overlapping regions
            if i > 0 and y_start < stitch_points[i-1] + images[i-1].shape[0]:
                # There's overlap - do alpha blending
                overlap_start = y_start
                overlap_end = stitch_points[i-1] + images[i-1].shape[0]
                
                for y in range(overlap_start, min(overlap_end, y_end)):
                    alpha = (y - overlap_start) / (overlap_end - overlap_start)
                    img_y = y - y_start
                    if img_y < h:
                        canvas[y, :w] = (
                            canvas[y, :w] * (1 - alpha) + 
                            img[img_y, :] * alpha
                        ).astype(np.uint8)
            
            # Non-overlapping part
            non_overlap_start = stitch_points[i-1] + images[i-1].shape[0] if i > 0 else y_start
            for y in range(max(non_overlap_start, y_start), y_end):
                img_y = y - y_start
                if img_y < h:
                    canvas[y, :w] = img[img_y, :]
        
        # Save
        cv2.imwrite(output_path, canvas)
        logger.info(f"Stitched image saved: {output_path}")
        
        return output_path
    
    def _stitch_large(self, images, stitch_points, width, height, output_path):
        """Handle very large images by processing in chunks"""
        logger.info(f"Using chunked stitching for large image: {width}x{height}")
        
        # Use PIL for large image handling
        from PIL import Image
        Image.MAX_IMAGE_PIXELS = None  # Disable limit
        
        # Create image in chunks
        chunk_height = 10000
        chunks = []
        
        for chunk_start in range(0, height, chunk_height):
            chunk_end = min(chunk_start + chunk_height, height)
            chunk = np.zeros((chunk_end - chunk_start, width, 3), dtype=np.uint8)
            
            # Find which images contribute to this chunk
            for img, y_start in zip(images, stitch_points):
                img_end = y_start + img.shape[0]
                
                if img_end <= chunk_start or y_start >= chunk_end:
                    continue  # No overlap
                
                # Calculate overlap
                src_start = max(0, chunk_start - y_start)
                src_end = min(img.shape[0], chunk_end - y_start)
                dst_start = max(0, y_start - chunk_start)
                dst_end = dst_start + (src_end - src_start)
                
                chunk[dst_start:dst_end, :img.shape[1]] = img[src_start:src_end, :]
            
            chunks.append(chunk)
        
        # Combine chunks
        result = np.vstack(chunks)
        cv2.imwrite(output_path, result)
        
        return output_path


class TileGenerator:
    """Generates Deep Zoom tiles from stitched images"""
    
    def __init__(self):
        self.tile_size = 256
        self.overlap = 0
    
    def generate_tiles(self, image_path: str, output_dir: str) -> Dict[str, Any]:
        """
        Generate Deep Zoom Image (DZI) tiles.
        Returns manifest with tile information.
        """
        logger.info(f"Generating tiles for: {image_path}")
        
        # Load image
        img = cv2.imread(image_path)
        height, width = img.shape[:2]
        
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)
        
        # Calculate number of levels
        max_dimension = max(width, height)
        num_levels = int(np.ceil(np.log2(max_dimension / self.tile_size))) + 1
        
        manifest = {
            'width': width,
            'height': height,
            'tile_size': self.tile_size,
            'overlap': self.overlap,
            'format': 'png',
            'levels': []
        }
        
        current_img = img
        
        for level in range(num_levels - 1, -1, -1):
            level_dir = output_path / str(level)
            level_dir.mkdir(exist_ok=True)
            
            h, w = current_img.shape[:2]
            tiles_x = int(np.ceil(w / self.tile_size))
            tiles_y = int(np.ceil(h / self.tile_size))
            
            level_info = {
                'level': level,
                'width': w,
                'height': h,
                'tiles_x': tiles_x,
                'tiles_y': tiles_y
            }
            
            # Generate tiles for this level
            for ty in range(tiles_y):
                for tx in range(tiles_x):
                    x1 = tx * self.tile_size
                    y1 = ty * self.tile_size
                    x2 = min(x1 + self.tile_size, w)
                    y2 = min(y1 + self.tile_size, h)
                    
                    tile = current_img[y1:y2, x1:x2]
                    tile_path = level_dir / f"{tx}_{ty}.png"
                    cv2.imwrite(str(tile_path), tile)
            
            manifest['levels'].append(level_info)
            
            # Downsample for next level
            if level > 0:
                new_w = max(1, w // 2)
                new_h = max(1, h // 2)
                current_img = cv2.resize(current_img, (new_w, new_h))
        
        # Save manifest
        import json
        manifest_path = output_path / 'manifest.json'
        with open(manifest_path, 'w') as f:
            json.dump(manifest, f, indent=2)
        
        # Generate DZI XML
        dzi_content = f'''<?xml version="1.0" encoding="UTF-8"?>
<Image xmlns="http://schemas.microsoft.com/deepzoom/2008"
       Format="png"
       Overlap="{self.overlap}"
       TileSize="{self.tile_size}">
    <Size Width="{width}" Height="{height}"/>
</Image>'''
        
        dzi_path = output_path / 'thread.dzi'
        with open(dzi_path, 'w') as f:
            f.write(dzi_content)
        
        logger.info(f"Generated {num_levels} levels of tiles")
        
        return manifest


class FrameProcessorService:
    """Main service for processing captured frames"""
    
    def __init__(self):
        self.sessions: Dict[str, CaptureSession] = {}
        self.stitcher = FrameStitcher()
        self.tile_generator = TileGenerator()
    
    def create_session(self) -> str:
        """Create a new capture session"""
        session_id = str(uuid.uuid4())[:8]
        self.sessions[session_id] = CaptureSession(session_id)
        logger.info(f"Created capture session: {session_id}")
        return session_id
    
    def add_frame(self, session_id: str, frame_data: Dict[str, Any]) -> None:
        """Add a frame to a session"""
        if session_id not in self.sessions:
            session_id = self.create_session()
        
        self.sessions[session_id].add_frame(frame_data)
    
    async def complete_session(
        self,
        session_id: str,
        metadata: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Complete a capture session: stitch frames and generate tiles.
        """
        if session_id not in self.sessions:
            raise ValueError(f"Session not found: {session_id}")
        
        session = self.sessions[session_id]
        session.metadata = metadata
        
        # Sort frames by frame number
        sorted_frames = sorted(session.frames, key=lambda f: f['frame_number'])
        frame_paths = [f['path'] for f in sorted_frames]
        
        # Stitch frames
        stitched_path = str(STITCHED_DIR / f"{session_id}_stitched.png")
        self.stitcher.stitch_frames(frame_paths, stitched_path)
        
        # Generate tiles
        tiles_dir = str(TILES_DIR / session_id)
        manifest = self.tile_generator.generate_tiles(stitched_path, tiles_dir)
        
        # Clean up session
        del self.sessions[session_id]
        
        return {
            'session_id': session_id,
            'stitched_image': stitched_path,
            'tiles_dir': tiles_dir,
            'manifest': manifest,
            'total_frames': len(frame_paths)
        }
    
    def get_session_info(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get info about a session"""
        if session_id not in self.sessions:
            return None
        
        session = self.sessions[session_id]
        return {
            'session_id': session_id,
            'frame_count': len(session.frames),
            'metadata': session.metadata
        }


# Singleton instance
frame_processor = FrameProcessorService()