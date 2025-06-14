-- Ice Breaker Bingo Database Schema
-- Migration: Create prompt library and game tables

-- Categories for organizing prompts
CREATE TABLE IF NOT EXISTS prompt_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prompts/questions for the bingo cards
CREATE TABLE IF NOT EXISTS prompts (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    category_id INTEGER REFERENCES prompt_categories(id),
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 3) DEFAULT 2, -- 1=easy, 2=medium, 3=hard
    appropriateness_level INTEGER CHECK (appropriateness_level BETWEEN 1 AND 5) DEFAULT 3, -- 1=mild, 5=steamy
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Games/sessions
CREATE TABLE IF NOT EXISTS icebreaker_games (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    room_code VARCHAR(10) UNIQUE NOT NULL, -- For players to join
    status VARCHAR(20) DEFAULT 'setup' CHECK (status IN ('setup', 'active', 'paused', 'completed')),
    max_players INTEGER DEFAULT 20,
    min_players INTEGER DEFAULT 4,
    created_by VARCHAR(100), -- Guest user nickname who created the game
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    settings JSONB DEFAULT '{}', -- Game settings (time limits, win conditions, etc.)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Player assignments to games
CREATE TABLE IF NOT EXISTS game_players (
    id SERIAL PRIMARY KEY,
    game_id INTEGER REFERENCES icebreaker_games(id) ON DELETE CASCADE,
    player_nickname VARCHAR(50) NOT NULL,
    player_session_id VARCHAR(100), -- For guest user identification
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    UNIQUE(game_id, player_nickname)
);

-- Individual bingo cards for each player
CREATE TABLE IF NOT EXISTS bingo_cards (
    id SERIAL PRIMARY KEY,
    game_id INTEGER REFERENCES icebreaker_games(id) ON DELETE CASCADE,
    player_id INTEGER REFERENCES game_players(id) ON DELETE CASCADE,
    card_data JSONB NOT NULL, -- 5x5 grid with prompt IDs and positions
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(game_id, player_id)
);

-- Track player progress on their bingo cards
CREATE TABLE IF NOT EXISTS player_progress (
    id SERIAL PRIMARY KEY,
    game_id INTEGER REFERENCES icebreaker_games(id) ON DELETE CASCADE,
    player_id INTEGER REFERENCES game_players(id) ON DELETE CASCADE,
    card_id INTEGER REFERENCES bingo_cards(id) ON DELETE CASCADE,
    square_position INTEGER NOT NULL CHECK (square_position BETWEEN 0 AND 24), -- 0-24 for 5x5 grid
    prompt_id INTEGER REFERENCES prompts(id),
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verified_by VARCHAR(100), -- Admin who verified if needed
    UNIQUE(card_id, square_position)
);

-- Track game winners
CREATE TABLE IF NOT EXISTS game_winners (
    id SERIAL PRIMARY KEY,
    game_id INTEGER REFERENCES icebreaker_games(id) ON DELETE CASCADE,
    player_id INTEGER REFERENCES game_players(id) ON DELETE CASCADE,
    win_pattern VARCHAR(20) NOT NULL, -- 'horizontal', 'vertical', 'diagonal', 'four_corners', 'full_card'
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin actions log
CREATE TABLE IF NOT EXISTS admin_actions (
    id SERIAL PRIMARY KEY,
    game_id INTEGER REFERENCES icebreaker_games(id),
    admin_nickname VARCHAR(100),
    action_type VARCHAR(50) NOT NULL,
    action_details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_prompts_category ON prompts(category_id);
CREATE INDEX IF NOT EXISTS idx_prompts_difficulty ON prompts(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_prompts_active ON prompts(is_active);
CREATE INDEX IF NOT EXISTS idx_games_status ON icebreaker_games(status);
CREATE INDEX IF NOT EXISTS idx_games_room_code ON icebreaker_games(room_code);
CREATE INDEX IF NOT EXISTS idx_players_game ON game_players(game_id);
CREATE INDEX IF NOT EXISTS idx_progress_card ON player_progress(card_id);
CREATE INDEX IF NOT EXISTS idx_progress_game ON player_progress(game_id);

-- Insert default categories
INSERT INTO prompt_categories (name, description) VALUES 
    ('dating', 'Dating and relationship experiences'),
    ('experiences', 'Life experiences and adventures'),
    ('preferences', 'Personal preferences and desires'),
    ('secrets', 'Fun secrets and confessions'),
    ('physical', 'Physical attraction and experiences')
ON CONFLICT (name) DO NOTHING;

-- Insert sample prompts (steamy ice breaker content)
INSERT INTO prompts (content, category_id, difficulty_level, appropriateness_level) VALUES 
    ('Find someone who has kissed on the first date', 1, 1, 2),
    ('Find someone who has been skinny dipping', 2, 2, 3),
    ('Find someone who has dated a coworker', 1, 1, 2),
    ('Find someone who owns more than 3 dating apps', 1, 1, 1),
    ('Find someone who has had a one-night stand', 1, 2, 4),
    ('Find someone who has been to a strip club', 2, 2, 3),
    ('Find someone who prefers morning intimacy', 3, 1, 3),
    ('Find someone who has sexted at work', 4, 3, 4),
    ('Find someone who has kissed someone of the same gender', 2, 2, 3),
    ('Find someone who has role-played in the bedroom', 3, 3, 4),
    ('Find someone who has sent nudes', 4, 2, 4),
    ('Find someone who has used a dating app while in a relationship', 1, 3, 3),
    ('Find someone who has had sex in a public place', 2, 3, 5),
    ('Find someone who has been caught masturbating', 4, 3, 4),
    ('Find someone who prefers to be dominant', 3, 2, 4),
    ('Find someone who has cheated on a partner', 1, 3, 3),
    ('Find someone who has been in a threesome', 2, 3, 5),
    ('Find someone who has used handcuffs', 3, 3, 4),
    ('Find someone who has had sex on the first date', 1, 2, 4),
    ('Find someone who has made out with a stranger', 2, 2, 3),
    ('Find someone who has been to a sex shop', 2, 2, 3),
    ('Find someone who has watched porn with a partner', 3, 2, 3),
    ('Find someone who has had a friends-with-benefits relationship', 1, 2, 3),
    ('Find someone who has fantasized about a celebrity', 3, 1, 2),
    ('Find someone who has been walked in on during sex', 4, 2, 3)
ON CONFLICT DO NOTHING;

-- Enable Row Level Security (RLS) for data protection
ALTER TABLE prompt_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE icebreaker_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE bingo_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_winners ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (suitable for demo/party game)
CREATE POLICY "Enable read access for all users" ON prompt_categories FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON prompts FOR SELECT USING (is_active = true);
CREATE POLICY "Enable all access for games" ON icebreaker_games FOR ALL USING (true);
CREATE POLICY "Enable all access for players" ON game_players FOR ALL USING (true);
CREATE POLICY "Enable all access for cards" ON bingo_cards FOR ALL USING (true);
CREATE POLICY "Enable all access for progress" ON player_progress FOR ALL USING (true);
CREATE POLICY "Enable all access for winners" ON game_winners FOR ALL USING (true);
CREATE POLICY "Enable all access for admin actions" ON admin_actions FOR ALL USING (true); 