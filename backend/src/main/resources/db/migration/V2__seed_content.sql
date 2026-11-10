-- Initial EDITABLE content. No credentials, no invented achievements or metrics.
-- Everything below can be changed from the admin dashboard.

INSERT INTO profile_settings (id, full_name, headline, intro, about, interests, highlights, contact_blurb)
VALUES (1, 'Aditi Jain',
  'Software Engineer | Full-Stack Development | AI Engineering',
  'I build practical applications, dig into how systems really work, and keep sharpening my engineering skills.',
  'I am a Computer Science graduate from SRM University and a software engineer at KPMG India. I enjoy building practical applications, understanding systems deeply, and continuously improving my technical skills.',
  'Full-stack development
Backend engineering
Java and Spring Boot
AI and machine learning
LLMs and AI-powered applications',
  'Computer Science graduate, SRM University
Software Engineer at KPMG India
Focused on practical, well-engineered applications',
  'Interested in software engineering roles, collaborations, or just talking tech? Get in touch.');

INSERT INTO experience (role, employer, display_order, visible, description)
VALUES ('Software Engineer', 'KPMG India', 0, TRUE, 'Software engineer at KPMG India.');

INSERT INTO skill_category (name, display_order) VALUES ('Programming languages', 0);
INSERT INTO skill_category (name, display_order) VALUES ('Frontend development', 1);
INSERT INTO skill_category (name, display_order) VALUES ('Backend development', 2);
INSERT INTO skill_category (name, display_order) VALUES ('Databases', 3);
INSERT INTO skill_category (name, display_order) VALUES ('AI and machine learning', 4);
INSERT INTO skill_category (name, display_order) VALUES ('Tools and platforms', 5);

INSERT INTO skill (category_id, name, display_order) SELECT id, 'Java', 0 FROM skill_category WHERE name = 'Programming languages';
INSERT INTO skill (category_id, name, display_order) SELECT id, 'TypeScript', 1 FROM skill_category WHERE name = 'Programming languages';
INSERT INTO skill (category_id, name, display_order) SELECT id, 'React', 0 FROM skill_category WHERE name = 'Frontend development';
INSERT INTO skill (category_id, name, display_order) SELECT id, 'Tailwind CSS', 1 FROM skill_category WHERE name = 'Frontend development';
INSERT INTO skill (category_id, name, display_order) SELECT id, 'Spring Boot', 0 FROM skill_category WHERE name = 'Backend development';
INSERT INTO skill (category_id, name, display_order) SELECT id, 'REST APIs', 1 FROM skill_category WHERE name = 'Backend development';
INSERT INTO skill (category_id, name, display_order) SELECT id, 'PostgreSQL', 0 FROM skill_category WHERE name = 'Databases';
INSERT INTO skill (category_id, name, display_order) SELECT id, 'LLMs', 0 FROM skill_category WHERE name = 'AI and machine learning';
INSERT INTO skill (category_id, name, display_order) SELECT id, 'Machine learning', 1 FROM skill_category WHERE name = 'AI and machine learning';
INSERT INTO skill (category_id, name, display_order) SELECT id, 'Git', 0 FROM skill_category WHERE name = 'Tools and platforms';
INSERT INTO skill (category_id, name, display_order) SELECT id, 'Docker', 1 FROM skill_category WHERE name = 'Tools and platforms';

-- Candidate projects: DRAFTS only. Review, complete, and publish from the admin dashboard.
INSERT INTO project (title, slug, summary, status, featured, published, display_order, category, created_at, updated_at) VALUES
 ('MeetAssist — Real-Time AI Meeting Assistant', 'meetassist', 'Draft — add a verified summary.', 'IN_PROGRESS', FALSE, FALSE, 0, 'AI', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO project (title, slug, summary, status, featured, published, display_order, category, created_at, updated_at) VALUES
 ('SRH — Smart Resource Hiring', 'srh-smart-resource-hiring', 'Draft — add a verified summary.', 'IN_PROGRESS', FALSE, FALSE, 1, 'Full-stack', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO project (title, slug, summary, status, featured, published, display_order, category, created_at, updated_at) VALUES
 ('Phoenix IQ AI', 'phoenix-iq-ai', 'Draft — add a verified summary.', 'IN_PROGRESS', FALSE, FALSE, 2, 'AI', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO project (title, slug, summary, status, featured, published, display_order, category, created_at, updated_at) VALUES
 ('Depression Detection', 'depression-detection', 'Draft — add a verified summary.', 'IN_PROGRESS', FALSE, FALSE, 3, 'AI', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO project (title, slug, summary, status, featured, published, display_order, category, created_at, updated_at) VALUES
 ('AI Transaction Reconciliation and Exception Resolution Agent', 'ai-transaction-reconciliation-agent', 'Draft — confirm you are authorised to publish this before adding details.', 'IN_PROGRESS', FALSE, FALSE, 4, 'AI', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO project (title, slug, summary, status, featured, published, display_order, category, created_at, updated_at) VALUES
 ('Developer IDE and Plugin Risk Inventory', 'ide-plugin-risk-inventory', 'Draft — confirm you are authorised to publish this before adding details.', 'IN_PROGRESS', FALSE, FALSE, 5, 'Security', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
