-- Rozszerzenie do usuwania znaków diakrytycznych (polskie ogonki w wyszukiwaniu).
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Zaktualizowana funkcja: składa fulltext z unaccent (np. "Zieliński" -> "zielinski").
CREATE OR REPLACE FUNCTION client_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW."searchVector" :=
    to_tsvector('simple', public.unaccent(
      coalesce(NEW."firstName", '') || ' ' ||
      coalesce(NEW."lastName", '')  || ' ' ||
      coalesce(NEW."phone", '')     || ' ' ||
      coalesce(NEW."email", '')     || ' ' ||
      coalesce(NEW."address", '')   || ' ' ||
      coalesce(NEW."city", '')
    ));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Backfill z unaccent.
UPDATE "Client" SET "searchVector" =
  to_tsvector('simple', public.unaccent(
    coalesce("firstName", '') || ' ' ||
    coalesce("lastName", '')  || ' ' ||
    coalesce("phone", '')     || ' ' ||
    coalesce("email", '')     || ' ' ||
    coalesce("address", '')   || ' ' ||
    coalesce("city", '')
  ));
