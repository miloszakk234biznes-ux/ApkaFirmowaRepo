-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "searchVector" tsvector;

-- CreateIndex
CREATE INDEX "Client_searchVector_idx" ON "Client" USING GIN ("searchVector");

-- Funkcja aktualizująca kolumnę fulltext z pól klienta (konfiguracja 'simple').
CREATE OR REPLACE FUNCTION client_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW."searchVector" :=
    to_tsvector('simple',
      coalesce(NEW."firstName", '') || ' ' ||
      coalesce(NEW."lastName", '')  || ' ' ||
      coalesce(NEW."phone", '')     || ' ' ||
      coalesce(NEW."email", '')     || ' ' ||
      coalesce(NEW."address", '')   || ' ' ||
      coalesce(NEW."city", '')
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger utrzymujący kolumnę przy INSERT/UPDATE.
DROP TRIGGER IF EXISTS client_search_vector_trigger ON "Client";
CREATE TRIGGER client_search_vector_trigger
  BEFORE INSERT OR UPDATE OF "firstName", "lastName", "phone", "email", "address", "city"
  ON "Client"
  FOR EACH ROW EXECUTE FUNCTION client_search_vector_update();

-- Backfill istniejących wierszy.
UPDATE "Client" SET "searchVector" =
  to_tsvector('simple',
    coalesce("firstName", '') || ' ' ||
    coalesce("lastName", '')  || ' ' ||
    coalesce("phone", '')     || ' ' ||
    coalesce("email", '')     || ' ' ||
    coalesce("address", '')   || ' ' ||
    coalesce("city", '')
  );
