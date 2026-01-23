-- ============================================
-- flayre.ai Database Schema
-- Supabase (PostgreSQL)
-- ============================================

-- ============================================
-- PROFILES (extends auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- USER SUBSCRIPTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    
    -- Subscription details
    plan_type TEXT NOT NULL DEFAULT 'free' CHECK (plan_type IN ('free', 'pro')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due', 'trialing')),
    
    -- Polar.sh integration
    polar_subscription_id TEXT UNIQUE,
    polar_customer_id TEXT,
    
    -- Billing dates
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    
    -- Usage tracking
    monthly_analyses_used INT DEFAULT 0,
    monthly_analyses_limit INT DEFAULT 10,
    last_reset_at TIMESTAMPTZ DEFAULT NOW(),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- ============================================
-- CONVERSATIONS (analysis sessions)
-- ============================================
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    
    -- Platform info
    platform TEXT NOT NULL CHECK (platform IN ('whatsapp', 'instagram', 'discord', 'other')),
    
    -- Analysis context
    context_summary TEXT,
    detected_tone TEXT,
    relationship_type TEXT,
    
    -- Visual elements detected (JSON array)
    visual_elements JSONB DEFAULT '[]',
    participants JSONB DEFAULT '[]',
    
    -- Screenshot storage (optional, for reference)
    screenshot_url TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at DESC);

-- ============================================
-- AI RESPONSES (generated suggestions)
-- ============================================
CREATE TABLE IF NOT EXISTS ai_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    
    -- Response content
    tone TEXT NOT NULL CHECK (tone IN ('warm', 'direct', 'playful')),
    content TEXT NOT NULL,
    character_count INT NOT NULL,
    
    -- Metadata
    model_used TEXT,
    tokens_used INT,
    
    -- User feedback
    was_copied BOOLEAN DEFAULT FALSE,
    was_used BOOLEAN DEFAULT FALSE,
    rating INT CHECK (rating IS NULL OR (rating BETWEEN 1 AND 5)),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_responses_conversation ON ai_responses(conversation_id);

-- ============================================
-- USAGE TRACKING (for analytics)
-- ============================================
CREATE TABLE IF NOT EXISTS usage_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    
    -- Event details
    event_type TEXT NOT NULL CHECK (event_type IN ('analysis', 'copy', 'checkout', 'login', 'signup')),
    event_data JSONB DEFAULT '{}',
    
    -- Context
    platform TEXT,
    user_agent TEXT,
    ip_hash TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usage_user ON usage_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_event ON usage_tracking(event_type);
CREATE INDEX IF NOT EXISTS idx_usage_created ON usage_tracking(created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- Subscriptions policies
CREATE POLICY "Users can view own subscription"
    ON user_subscriptions FOR SELECT
    USING (auth.uid() = user_id);

-- Conversations policies
CREATE POLICY "Users can view own conversations"
    ON conversations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own conversations"
    ON conversations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations"
    ON conversations FOR DELETE
    USING (auth.uid() = user_id);

-- AI Responses policies
CREATE POLICY "Users can view own responses"
    ON ai_responses FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM conversations 
            WHERE conversations.id = ai_responses.conversation_id 
            AND conversations.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own responses"
    ON ai_responses FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM conversations 
            WHERE conversations.id = ai_responses.conversation_id 
            AND conversations.user_id = auth.uid()
        )
    );

-- Usage tracking policies
CREATE POLICY "Users can view own usage"
    ON usage_tracking FOR SELECT
    USING (auth.uid() = user_id);

-- ============================================
-- TRIGGERS & FUNCTIONS
-- ============================================

-- Auto-create profile and subscription on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Create profile
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', '')
    );
    
    -- Create free subscription
    INSERT INTO public.user_subscriptions (user_id, plan_type, monthly_analyses_limit)
    VALUES (NEW.id, 'free', 10);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS subscriptions_updated_at ON user_subscriptions;
CREATE TRIGGER subscriptions_updated_at
    BEFORE UPDATE ON user_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Reset monthly usage when subscription period changes
CREATE OR REPLACE FUNCTION reset_monthly_usage()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.current_period_start IS NOT NULL 
       AND OLD.current_period_start IS NOT NULL 
       AND NEW.current_period_start != OLD.current_period_start THEN
        NEW.monthly_analyses_used = 0;
        NEW.last_reset_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS subscription_period_reset ON user_subscriptions;
CREATE TRIGGER subscription_period_reset
    BEFORE UPDATE ON user_subscriptions
    FOR EACH ROW EXECUTE FUNCTION reset_monthly_usage();

-- ============================================
-- SERVICE ROLE POLICIES (for backend)
-- ============================================

-- Allow service role full access for webhooks
CREATE POLICY "Service role full access on profiles"
    ON profiles FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role full access on subscriptions"
    ON user_subscriptions FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role full access on conversations"
    ON conversations FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role full access on ai_responses"
    ON ai_responses FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role full access on usage_tracking"
    ON usage_tracking FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');
