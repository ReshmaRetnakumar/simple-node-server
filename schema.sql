CREATE TABLE IF NOT EXISTS books (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  author VARCHAR(100) NOT NULL,
  published_year INT
);

INSERT INTO books (title, author, published_year) VALUES
  ('The Pragmatic Programmer', 'Andrew Hunt', 1999),
  ('Clean Code', 'Robert C. Martin', 2008);
