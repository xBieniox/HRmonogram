# HRmonogram ⏱️
> Full-stackowa aplikacja webowa (React + Python) do zarządzania czasem pracy i automatyzacji tworzenia harmonogramów, wyposażona w walidator zgodności z polskim Kodeksem Pracy.

## 📌 Kontekst Biznesowy i Problem
Tworzenie grafików dla zespołu stacji paliw w oparciu o stary system ERP i ręczne arkusze kalkulacyjne pochłaniało mnóstwo czasu menedżera. Dodatkowo, ręczne planowanie niosło za sobą ogromne ryzyko błędów ludzkich, takich jak łamanie przepisów prawa pracy dotyczących wymaganych przerw między zmianami. 

**HRmonogram** został zaprojektowany, aby rozwiązać ten problem poprzez cyfryzację procesu i wprowadzenie zautomatyzowanych reguł kontrolnych.

## 🚀 Główne Funkcjonalności

* 🛡️ **Labor Code Validator (Silnik Reguł Prawa Pracy):** Autorski moduł sprawdzający w czasie rzeczywistym, czy planowany grafik jest zgodny z polskim prawem (np. weryfikacja wymaganej 11-godzinnej przerwy dobowej między zmianami).
* 👥 **Zarządzanie Rolami i Użytkownikami:** Podział na widoki i uprawnienia dla Menedżerów (tworzenie grafików, zarządzanie zespołem) oraz Pracowników (podgląd własnego harmonogramu).
* 🏢 **Zarządzanie Obiektami:** Możliwość przypisywania pracowników i grafików do konkretnych lokalizacji/obiektów (np. różne stacje paliw).
* 📊 **Statystyki i Historia:** Wbudowany moduł śledzenia historii zmian w grafikach (`Schedule History`) oraz generowania podstawowych statystyk przepracowanych godzin.
* 🔒 **Bezpieczeństwo:** System autoryzacji i bezpiecznego logowania (moduł Auth).

## 💻 Tech Stack
Projekt został zbudowany z wykorzystaniem nowoczesnej architektury aplikacji internetowych:

* **Frontend:** React.js, HTML5, CSS3
* **Backend:** Python (Flask / REST API)
* **Baza Danych:** SQLite (lekka, zintegrowana baza relacyjna)
* **Narzędzia analityczne:** Pytest (do testów jednostkowych i integracyjnych silnika walidacji)

## 📸 Zrzuty Ekranu
*(Tutaj wstaw linki do swoich zrzutów ekranu – np. widok panelu menedżera, widok z błędem walidatora kodeksu pracy)*
* `![Dashboard Menedżera](link_do_zdjecia)`
* `![Walidator Kodeksu Pracy](link_do_zdjecia)`

## 🎯 Plany Rozwoju (Roadmap)
- [ ] Wdrożenie modułu samodzielnego zgłaszania dyspozycyjności przez pracowników.
- [ ] Eksport gotowych grafików do formatu PDF / Excel.
- [ ] Zaawansowane filtry statystyk dla działu HR.
