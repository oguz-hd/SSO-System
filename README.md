# Üniversite Bilgi Yönetim ve Yapay Zeka Analiz Platformu (SSO Portal)


### Kullanılan Portlar ve Erişim Noktaları
- **Frontend (Web Arayüzü):** `http://localhost:3000`
- **Backend API (Swagger Dökümantasyonu):** `http://localhost:8000/docs`
- **RabbitMQ Yönetim Paneli:** `http://localhost:15672` (Kullanıcı Adı: `guest`, Şifre: `guest`)
- **PostgreSQL:** `localhost:5432`
- **MySQL:** `localhost:13306`
- **Redis:** `localhost:56379`



## Proje Hakkında
Bu proje, modern web teknolojileri kullanılarak geliştirilmiş, mikroservis mimarisine sahip kapsamlı bir Üniversite Tek Oturum Açma (SSO) ve Bilgi Yönetim platformudur.
Proje içerisinde dinamik rol bazlı yetkilendirme (Süpervizör Matrisi), gerçek zamanlı sistem logları, tasarım laboratuvarı (Word formatındaki tasarımların GrapesJS'e çevrilmesi), duyuru panosu, işletme (staj) portalı, öğrenci işleri ve yapay zeka asistanı gibi yenilikçi özellikler bulunmaktadır. Süpervizör, tek bir panel üzerinden hangi rolün hangi ekranı görebileceğini (Okuma/Yazma/Silme) anlık olarak yönetebilir.

## Kullanılan Teknolojiler
- **Frontend:** Next.js 14, React, Tailwind CSS, Lucide Icons, GrapesJS
- **Backend:** FastAPI, Python, Pydantic, SQLAlchemy (Asenkron)
- **Mesaj Kuyruğu:** RabbitMQ (Servisler arası RPC tabanlı CRUD iletişimi)
- **Veritabanları:** PostgreSQL (Tamamen JSONB mimarisi ve Stored Procedure/Trigger yapısı), MySQL, Redis
- **Yapay Zeka:** OpenAI API (GPT-4o), RAG (Retrieval-Augmented Generation) altyapılı doküman analiz asistanı
- **Konteynerleştirme:** Docker, Docker Compose

## Projenin Başlatılması

Projenin kurulumu ve çalıştırılması Docker sayesinde son derece hızlı ve basittir:

1. Terminali açın ve projenin ana dizinine gidin.
2. Sadece bir kereye mahsus ortam değişkenleri dosyasını oluşturun:
   ```bash
   cp .env.example .env
   ```
3. Konteynerleri derleyip arka planda başlatmak için:
   ```bash
   docker compose up --build -d
   ```
4. **Sorun Giderme / Sıfırlama:** Eğer veritabanını tamamen temizleyip sistemi fabrika ayarlarına döndürmek isterseniz şu komutları kullanabilirsiniz:
   ```bash
   docker compose down -v
   docker compose up --build -d
   ```

Sistem saniyeler içinde başlatıldıktan sonra siteye [http://localhost:3000](http://localhost:3000) adresinden ulaşabilirsiniz.


## Test Kimlik Bilgileri

Farklı kullanıcı türlerinin sadece yetkisi olan sayfaları görebildiğini test etmek için aşağıdaki hesapları kullanabilirsiniz.
**(Tüm hesapların şifresi `1234` olarak belirlenmiştir)**

- **Süpervizör:** admin / 1234 *(Tüm sistemi yönetir, yetki dağıtır)*
- **Akademisyen (Öğretmen):** ogretmen / 1234
- **Öğrenci:** ogrenci / 1234
- **İşletme:** isletme / 1234
- **Okul:** okul / 1234

## Sistem Mimarisi ve İşleyiş

- **API Ağ Geçidi (`backend-service`):** Ön yüzden (Frontend) gelen istekleri (login, veri okuma vb.) alır, yetkilendirmeleri kontrol eder ve RabbitMQ üzerinden Consumer (Tüketici) servisine gönderir. Veritabanına doğrudan bağlanmaz.
- **Tüketici Servis (`crud-consumer`):** RabbitMQ kuyruğundaki RPC mesajlarını dinler. Güvenli bir şekilde PostgreSQL'e bağlanarak veritabanına ekleme/silme (CRUD) yapar.
- **Veritabanı (PostgreSQL):** Tabloların tamamı esnek yapıdaki `JSONB` formatını kullanır. Her tablonun kendi Trigger'ı (Tetikleyicisi) vardır; bir veri eklendiğinde veya silindiğinde bu tetikleyiciler otomatik olarak çalışıp `logs` (Sistem Denetim İzleri) tablosuna log bırakır.

## Yapay Zeka Asistanı Kullanımı (Opsiyonel)
Sistemdeki akıllı asistan ile Word dökümanlarından tasarım oluşturmak veya yüklenen metin belgelerine soru sormak (RAG) isterseniz kendi OpenAI anahtarınızı projeye ekleyebilirsiniz:
1. `.env` dosyasını açın.
2. İçerisine `OPENAI_API_KEY=sk-proj-xxxxxxxx` yazın.
3. Sistemi `docker compose restart backend-service` ile yeniden başlatın.
