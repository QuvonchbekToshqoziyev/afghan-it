UPDATE courses AS c
SET language = 'en', translations = jsonb_build_object(
  'en', jsonb_build_object('title', c.title, 'description', c.description),
  'fa', jsonb_build_object('title', v.fa_title, 'description', 'برنامه آموزشی عملی برای ساختن مهارت‌های واقعی.'),
  'ps', jsonb_build_object('title', v.ps_title, 'description', 'عملي پروګرام د ریښتینو مهارتونو د جوړولو لپاره.')
)
FROM (VALUES
  ('frontend-development', 'توسعه فرانت‌اند', 'فرنټ اینډ پراختیا'),
  ('backend-development', 'توسعه بک‌اند', 'بیک اینډ پراختیا'),
  ('full-stack-development', 'توسعه فول‌استک', 'فول سټک پراختیا'),
  ('databases', 'پایگاه‌های داده', 'ډیټابېسونه'),
  ('devops', 'دوآپس', 'ډیواپس'),
  ('cyber-security', 'امنیت سایبری', 'سایبري امنیت'),
  ('ai-machine-learning', 'هوش مصنوعی و یادگیری ماشین', 'مصنوعي ځیرکتیا او ماشین زده کړه'),
  ('ui-ux-design', 'طراحی UI/UX', 'UI/UX ډیزاین'),
  ('english-beginner', 'انگلیسی مقدماتی', 'د انګلیسي پیل'),
  ('business-english', 'انگلیسی تجاری', 'سوداګریزه انګلیسي'),
  ('professional-english', 'انگلیسی حرفه‌ای', 'مسلکي انګلیسي'),
  ('english-for-it', 'انگلیسی برای فناوری اطلاعات', 'د IT لپاره انګلیسي')
) AS v(slug, fa_title, ps_title) WHERE c.slug = v.slug;
