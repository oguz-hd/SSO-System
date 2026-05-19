CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE logs (
    id SERIAL PRIMARY KEY,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    value JSONB NOT NULL
);

CREATE TABLE business_jobs (
    id SERIAL PRIMARY KEY,
    value JSONB NOT NULL
);

CREATE TABLE assignments (
    id SERIAL PRIMARY KEY,
    value JSONB NOT NULL
);

CREATE TABLE designs (
    id SERIAL PRIMARY KEY,
    value JSONB NOT NULL
);

CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    value JSONB NOT NULL
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    role_id INTEGER REFERENCES roles(id) ON DELETE SET NULL,
    value JSONB NOT NULL
);

CREATE TABLE permissions (
    id SERIAL PRIMARY KEY,
    role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
    value JSONB NOT NULL
);

CREATE TABLE announcements (
    id SERIAL PRIMARY KEY,
    value JSONB NOT NULL
);

CREATE OR REPLACE FUNCTION log_table_changes()
RETURNS TRIGGER AS $$
DECLARE
    log_data JSONB;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        log_data = jsonb_build_object(
            'operation', 'DELETE',
            'table', TG_TABLE_NAME,
            'old_record', row_to_json(OLD)
        );
        INSERT INTO logs (value) VALUES (log_data);
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
        log_data = jsonb_build_object(
            'operation', 'UPDATE',
            'table', TG_TABLE_NAME,
            'old_record', row_to_json(OLD),
            'new_record', row_to_json(NEW)
        );
        INSERT INTO logs (value) VALUES (log_data);
        RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
        log_data = jsonb_build_object(
            'operation', 'INSERT',
            'table', TG_TABLE_NAME,
            'new_record', row_to_json(NEW)
        );
        INSERT INTO logs (value) VALUES (log_data);
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON users
FOR EACH ROW EXECUTE FUNCTION log_table_changes();

CREATE TRIGGER business_jobs_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON business_jobs
FOR EACH ROW EXECUTE FUNCTION log_table_changes();

CREATE TRIGGER assignments_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON assignments
FOR EACH ROW EXECUTE FUNCTION log_table_changes();

CREATE TRIGGER designs_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON designs
FOR EACH ROW EXECUTE FUNCTION log_table_changes();

CREATE TRIGGER roles_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON roles
FOR EACH ROW EXECUTE FUNCTION log_table_changes();

CREATE TRIGGER permissions_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON permissions
FOR EACH ROW EXECUTE FUNCTION log_table_changes();

CREATE TRIGGER announcements_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON announcements
FOR EACH ROW EXECUTE FUNCTION log_table_changes();

CREATE OR REPLACE FUNCTION update_role_screen_assignment(
    p_role_id INTEGER,
    p_screen VARCHAR,
    p_can_read BOOLEAN,
    p_can_write BOOLEAN,
    p_can_delete BOOLEAN
)
RETURNS VOID AS $$
DECLARE
    v_permission_id INTEGER;
BEGIN
    SELECT id INTO v_permission_id
    FROM permissions
    WHERE role_id = p_role_id AND value->>'screen' = p_screen;

    IF FOUND THEN
        IF NOT p_can_read AND NOT p_can_write AND NOT p_can_delete THEN
            DELETE FROM permissions WHERE id = v_permission_id;
        ELSE
            UPDATE permissions
            SET value = jsonb_set(
                        jsonb_set(
                            jsonb_set(value, '{can_read}', to_jsonb(p_can_read)),
                            '{can_write}', to_jsonb(p_can_write)
                        ),
                        '{can_delete}', to_jsonb(p_can_delete)
                    )
            WHERE id = v_permission_id;
        END IF;
    ELSIF p_can_read OR p_can_write OR p_can_delete THEN
        INSERT INTO permissions (role_id, value)
        VALUES (
            p_role_id,
            jsonb_build_object(
                'screen', p_screen,
                'can_read', p_can_read,
                'can_write', p_can_write,
                'can_delete', p_can_delete,
                'allowed_extensions', '["txt","png","jpg","jpeg","pdf","docx","xlsx"]'::jsonb
            )
        );
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Yetki Kopyalama SP'si
CREATE OR REPLACE PROCEDURE copy_role_permissions(
    p_source_role_id INTEGER,
    p_target_role_id INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
    DELETE FROM permissions WHERE role_id = p_target_role_id;
    INSERT INTO permissions (role_id, value)
    SELECT p_target_role_id, value
    FROM permissions
    WHERE role_id = p_source_role_id;
END;
$$;

-- Roller
INSERT INTO roles (value) VALUES
    ('{"name": "supervisor", "label": "Süpervizör", "description": "tüm yetkiler"}'),
    ('{"name": "akademisyen", "label": "Akademisyen", "description": "duyuru ve ödev"}'),
    ('{"name": "ogrenci", "label": "Öğrenci", "description": "duyuru okuma ve ödev"}'),
    ('{"name": "isletme", "label": "İşletme", "description": "staj ve kurumsal"}'),
    ('{"name": "okul", "label": "Okul", "description": "öğrenci listesi ve okul işleri"}');

INSERT INTO users (role_id, value) VALUES
    (1, '{"username": "admin", "email": "admin@uni.edu.tr", "password_hash": "81dc9bdb52d04dc20036dbd8313ed055", "full_name": "Sistem Yöneticisi", "is_active": true}'),
    (2, '{"username": "ogretmen", "email": "ahmet.yilmaz@uni.edu.tr", "password_hash": "81dc9bdb52d04dc20036dbd8313ed055", "full_name": "Prof. Dr. Ahmet Yılmaz", "is_active": true}'),
    (3, '{"username": "ogrenci", "email": "ali.veli@stu.uni.edu.tr", "password_hash": "81dc9bdb52d04dc20036dbd8313ed055", "full_name": "Ali Veli", "student_no": "2021001234", "is_active": true}'),
    (4, '{"username": "isletme", "email": "hr@teknoloji-as.com.tr", "password_hash": "81dc9bdb52d04dc20036dbd8313ed055", "full_name": "Teknoloji A.Ş.", "is_active": true}'),
    (5, '{"username": "okul", "email": "okul@uni.edu.tr", "password_hash": "81dc9bdb52d04dc20036dbd8313ed055", "full_name": "Okul Yönetimi", "is_active": true}');

INSERT INTO permissions (role_id, value) VALUES
    (1, '{"screen": "supervisor_matrix", "can_read": true, "can_write": true, "can_delete": true}'),
    (1, '{"screen": "system_logs", "can_read": true, "can_write": false, "can_delete": false}'),
    (1, '{"screen": "announcements", "can_read": true, "can_write": true, "can_delete": true}'),
    (1, '{"screen": "assignments", "can_read": true, "can_write": true, "can_delete": true}'),
    (1, '{"screen": "design_lab", "can_read": true, "can_write": true, "can_delete": true, "allowed_extensions": ["txt","docx","png","jpg","jpeg","pdf"]}'),
    (1, '{"screen": "business", "can_read": true, "can_write": true, "can_delete": true}'),
    (1, '{"screen": "student_list", "can_read": true, "can_write": true, "can_delete": true}'),
    (2, '{"screen": "announcements", "can_read": true, "can_write": true, "can_delete": false}'),
    (2, '{"screen": "assignments", "can_read": true, "can_write": true, "can_delete": false}'),
    (3, '{"screen": "announcements", "can_read": true, "can_write": false, "can_delete": false}'),
    (3, '{"screen": "assignments", "can_read": true, "can_write": true, "can_delete": false, "allowed_extensions": ["txt","docx","pdf"]}'),
    (4, '{"screen": "business", "can_read": true, "can_write": true, "can_delete": false}'),
    (4, '{"screen": "announcements", "can_read": true, "can_write": false, "can_delete": false}'),
    (5, '{"screen": "student_list", "can_read": true, "can_write": true, "can_delete": false}'),
    (5, '{"screen": "announcements", "can_read": true, "can_write": false, "can_delete": false}');

INSERT INTO announcements (value) VALUES
    ('{"title": "ara sınav tarihleri güncellendi", "content": "2026 bahar dönemi ara sınav takvimi güncellenmiştir.", "author": "öğrenci işleri", "date": "19 mayıs 2026", "priority": "high"}'),
    ('{"title": "yapay zeka laboratuvarı açılışı", "content": "RAG ve GrapesJS tabanlı tasarım laboratuvarı kullanıma açılmıştır.", "author": "prof. dr. ahmet yılmaz", "date": "18 mayıs 2026", "priority": "normal"}'),
    ('{"title": "mezuniyet töreni formları", "content": "Son sınıf öğrencileri cübbe formlarını teslim etmelidir.", "author": "rektörlük", "date": "15 mayıs 2026", "priority": "normal"}');
