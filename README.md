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

<img alt="Panel statystyk HR" src="https://github.com/user-attachments/assets/b3becbdf-2678-45bf-9f6f-c6e650938eb6" />

*Rys 1. Widok domyślny – panel statystyk pracownika HR.*

---

<img alt="Widok pracownika" src="https://github.com/user-attachments/assets/5f3f0780-4a84-43d0-9083-5e70f9f895c2" />

*Rys 2. Widok domyślny z perspektywy panelu pracownika.*

---

<img alt="Karty obiektów" src="https://github.com/user-attachments/assets/1df8725a-caa4-43a2-8816-52f6a6271f83" />

*Rys 3. Widok początkowy menedżera z kartami zarządzanych obiektów i formularzem dodawania.*

---

<img alt="Zarządzanie obiektem" src="https://github.com/user-attachments/assets/b45fa202-ec63-4626-be16-82e63db2acfb" />

*Rys 4. Widok szczegółów obiektu: lista działów (po lewej) oraz przypisani pracownicy (po prawej).*

---

<img alt="Lista grafików" src="https://github.com/user-attachments/assets/7935e4eb-eeae-4aee-b51b-e9af7def1dc4" />

*Rys 5. Lista aktywnych grafików dla danego obiektu oraz panel przycisków funkcyjnych.*

---

<img alt="Preferencje" src="https://github.com/user-attachments/assets/7c7b9676-6a79-48a1-995c-22f32ba9b582" />

*Rys 6. Konfiguracja preferencji harmonogramu: parametry (po lewej) i szablony (po prawej).*

---

<img alt="Kreator harmonogramu" src="https://github.com/user-attachments/assets/1f95b17a-33fe-4c21-b0c0-7877ff68f9ce" />

*Rys 7. Interfejs głównego kreatora harmonogramu z siatką pracowników i dniami miesiąca.*

## 🎯 Plany Rozwoju (Roadmap)
- [ ] Wdrożenie modułu samodzielnego zgłaszania dyspozycyjności przez pracowników.
- [ ] Eksport gotowych grafików do formatu PDF / Excel.
- [ ] Zaawansowane filtry statystyk dla działu HR.
