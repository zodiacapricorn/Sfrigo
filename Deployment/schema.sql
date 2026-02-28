-- 1. USERS Table (User Service)
-- Maps the authenticated user from Firebase to our internal system.
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firebase_uid VARCHAR(128) UNIQUE NOT NULL, -- ID from Firebase JWT
    username VARCHAR(50) UNIQUE NOT NULL,      -- Unique username for invitations
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. FRIDGES Table (Fridge Service)
-- Represents the virtual shared refrigerators.
CREATE TABLE fridges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT, -- Creator of the fridge
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. FRIDGE_MEMBERS Table (Fridge Service - Access Control)
-- Many-to-Many association between Users and Fridges.
-- Defines what a user can do inside a specific fridge.
CREATE TABLE fridge_members (
    fridge_id UUID NOT NULL REFERENCES fridges(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'MEMBER', -- Can be 'ADMIN' or 'MEMBER'
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (fridge_id, user_id)
);

-- 4. FRIDGE_INVITATIONS Table (Fridge Service - Invitations)
-- Gestisce gli inviti inviati dagli admin agli altri utenti per unirsi a un frigo
CREATE TABLE fridge_invitations (
    inviter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- Utente (admin) che manda l'invito
    invitee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- Utente che riceve l'invito
    fridge_id UUID NOT NULL REFERENCES fridges(id) ON DELETE CASCADE, -- Frigo a cui si viene invitati
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (inviter_id, invitee_id, fridge_id)
);