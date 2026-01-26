import sqlite3
import os

# Pobieramy katalog, w którym jesteśmy (zakładam folder 'backend')
current_dir = os.getcwd()

# Budujemy ścieżkę: wyjdź w górę (..), wejdź do 'database', znajdź plik
# os.path.join łączy te elementy w poprawną ścieżkę systemową
db_path = os.path.abspath(os.path.join(current_dir, '..', 'database', 'HRmonogram.db'))

print(f"🔍 Szukam bazy pod ścieżką: {db_path}")

if not os.path.exists(db_path):
    print("❌ BŁĄD: Nie znaleziono pliku!")
    print("Upewnij się, że uruchamiasz ten skrypt będąc w folderze 'HRmonogram/backend'.")
    exit()

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    print("✅ Połączono. Sprawdzam tabelę 'schedules'...")
    cursor.execute("PRAGMA table_info(schedules)")
    columns = [col[1] for col in cursor.fetchall()]

    if 'work_schedule_id' not in columns:
        print("🛠️  Brakuje kolumny. Dodaję 'work_schedule_id'...")
        cursor.execute("ALTER TABLE schedules ADD COLUMN work_schedule_id INTEGER REFERENCES work_schedules(id)")
        conn.commit()
        print("✅ SUKCES! Baza w folderze 'database' została naprawiona.")
    else:
        print("ℹ️  Kolumna już istnieje w tej bazie.")

    conn.close()

except Exception as e:
    print(f"❌ Błąd SQL: {e}")