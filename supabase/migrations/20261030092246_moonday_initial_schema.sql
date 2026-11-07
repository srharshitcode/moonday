-- ==========================================
-- 1. CORE USER PROFILES & PREFERENCES
-- ==========================================

CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    display_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
    cycle_length_days INT DEFAULT 28,
    period_length_days INT DEFAULT 5,
    theme TEXT DEFAULT 'system',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 2. PERIOD & CYCLE MANAGEMENT
-- ==========================================

CREATE TABLE period_episodes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    is_ongoing BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_date_range CHECK (end_date IS NULL OR start_date <= end_date)
);

CREATE TABLE period_day_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    episode_id UUID REFERENCES period_episodes(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    flow TEXT NOT NULL,
    color_name TEXT,
    color_hex VARCHAR(7),
    is_spotting BOOLEAN DEFAULT FALSE,
    clot_observations TEXT,
    pain_level INT CHECK (pain_level >= 0 AND pain_level <= 10),
    observations TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, date)
);

CREATE TABLE cycle_predictions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    predicted_start_date DATE NOT NULL,
    predicted_end_date DATE,
    estimated_ovulation_date DATE,
    fertile_window_start DATE,
    fertile_window_end DATE,
    confidence_score INT CHECK (confidence_score >= 0 AND confidence_score <= 100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 3. DAILY LOGGING & OBSERVATIONS
-- ==========================================

CREATE TABLE daily_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, date)
);

CREATE TABLE mood_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    mood TEXT NOT NULL,
    intensity INT CHECK (intensity >= 1 AND intensity <= 5),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE symptom_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    symptom TEXT NOT NULL,
    severity TEXT,
    duration TEXT,
    body_location TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE discharge_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    discharge_type TEXT NOT NULL,
    color TEXT,
    consistency TEXT,
    amount TEXT,
    odor_observation TEXT,
    itching BOOLEAN DEFAULT FALSE,
    associated_discomfort TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, date)
);

CREATE TABLE activity_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    activity_type TEXT NOT NULL,
    duration_minutes INT,
    perceived_intensity TEXT,
    energy_before TEXT,
    energy_after TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE craving_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    craving TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE wellness_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    sleep_duration_hours NUMERIC(4,2),
    sleep_quality TEXT,
    bedtime TIME,
    wake_up_time TIME,
    energy_level TEXT,
    stress_level TEXT,
    hydration_amount TEXT,
    medication_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, date)
);

-- ==========================================
-- 4. PRIVATE NOTES & INTIMACY
-- ==========================================

CREATE TABLE personal_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    title TEXT,
    content TEXT NOT NULL,
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE husband_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    content TEXT,
    what_you_need_right_now TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, date)
);

CREATE TABLE intimacy_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    activity TEXT NOT NULL,
    libido_intensity TEXT,
    protection_method TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 5. CONFIGURATION & LOGGING
-- ==========================================

CREATE TABLE custom_options (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    category TEXT NOT NULL,
    option_name TEXT NOT NULL,
    option_value TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE saved_favorites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    category TEXT NOT NULL,
    favorite_item TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE reminders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    reminder_type TEXT NOT NULL,
    time_of_day TIME NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE audit_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE period_episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE period_day_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cycle_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE symptom_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE discharge_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE craving_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE wellness_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE husband_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE intimacy_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view and update their own profile" ON profiles 
FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DO $$
DECLARE
    t TEXT;
    tables TEXT[] := ARRAY[
        'user_preferences', 'period_episodes', 'period_day_logs',
        'cycle_predictions', 'daily_logs', 'mood_entries', 'symptom_entries',
        'discharge_entries', 'activity_entries', 'craving_entries', 'wellness_entries',
        'personal_notes', 'husband_notes', 'intimacy_entries', 'custom_options',
        'saved_favorites', 'reminders', 'audit_events'
    ];
BEGIN
    FOREACH t IN ARRAY tables LOOP
        EXECUTE format('
            CREATE POLICY "Users can manage their own %I"
            ON %I
            FOR ALL
            USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);
        ', t, t);
    END LOOP;
END $$;

-- ==========================================
-- 7. PERFORMANCE INDEXES
-- ==========================================

CREATE INDEX idx_period_episodes_user_id ON period_episodes(user_id);
CREATE INDEX idx_period_day_logs_user_date ON period_day_logs(user_id, date);
CREATE INDEX idx_mood_entries_user_date ON mood_entries(user_id, date);
CREATE INDEX idx_symptom_entries_user_date ON symptom_entries(user_id, date);
CREATE INDEX idx_personal_notes_user_date ON personal_notes(user_id, date);
CREATE INDEX idx_intimacy_entries_user_date ON intimacy_entries(user_id, date);