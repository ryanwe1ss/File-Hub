CREATE TABLE public.filehub_logins (
	id serial4 NOT NULL,
	user_agent varchar NULL,
	ip_address varchar NULL,
	country varchar NULL,
	region varchar NULL,
	city varchar NULL,
	postal_code varchar NULL,
	date_created timestamp NULL
);