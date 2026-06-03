# Kitap Seti Platformu

Kurumlara özel kitap seti satış platformu. Üç kullanıcı tipi vardır: **Admin**, **Kurum Yetkilisi** ve **Öğrenci**. Giriş telefon numarası + SMS OTP ile yapılır; giriş yapmadan setler görüntülenemez.

## Hızlı başlangıç

```bash
npm install
cp .env.example .env      # geliştirme için varsayılanlar yeterli (mock modlar)
npm run dev
```

Tarayıcıdan `http://localhost:3000` adresini açın.

> Veritabanı kurulumu gerektirmez. Node 22 yerleşik SQLite'ı (`node:sqlite`) kullanılır ve `data/app.db` dosyası ilk çalıştırmada otomatik oluşturulup örnek verilerle doldurulur.
> Gereksinim: **Node 22+**.

## Demo giriş bilgileri

Geliştirme modunda (`SMS_PROVIDER=mock`) OTP kodu hem sunucu konsoluna yazılır hem de giriş ekranında "Geliştirme modu kodu" olarak gösterilir.

| Rol | Telefon | Açıklama |
|-----|---------|----------|
| Admin | `05550000001` | Tüm sistem yönetimi |
| Kurum Yetkilisi | `05550000002` | Atatürk Anadolu Lisesi |
| Öğrenci | `05550000003` | Mehmet Demir – 9/A |
| Öğrenci | `05550000004` | Zeynep Kaya – 9/B |
| Öğrenci | `05550000005` | Ali Çelik – 10/A |

Giriş: telefon numarasını girin → "Kod gönder" → ekranda görünen 6 haneli kodu girin.

## Kullanıcı akışları

**Admin** kurumlarla anlaşır; kurum, kitap, set ve öğrenci tanımlar. Setler sınıf seviyesi, şube ve öğretmene göre yapılandırılır. Sisteme tanımlı olmayan kişi giriş yapamaz.

**Kurum Yetkilisi** yalnızca kendi kurumunun öğrencilerini ve siparişlerini görür/yönetir.

**Öğrenci** giriş yaptıktan sonra yalnızca kendisine atanan setleri görür (kurum + sınıf + şube eşleşmesine göre). Set detayında içerdiği kitapları inceler, "Sepete ekle" ile satın almayı ilerletir, teslimat adresini girer, ödeme yapar ve ürünler adrese kargolanır.

### Set görünürlük kuralı

Bir öğrenci bir seti şu durumda görür: `set.kurum = öğrenci.kurum` **ve** `set.sınıf = öğrenci.sınıf` **ve** (`set.şube boş` **veya** `set.şube = öğrenci.şube`). Bu kontrol hem listede hem de set detay sayfasında uygulanır (yetkisiz set URL'i 404 döner).

## Mimari

- **Next.js 14 (App Router) + TypeScript** – sunucu bileşenleri ve server actions
- **Tailwind CSS** – arayüz
- **node:sqlite** – veri katmanı (`src/lib/db.ts`)
- **jose** – imzalı JWT oturum çerezi (`src/lib/session.ts`)
- **middleware.ts** – rol bazlı rota koruması (`/admin`, `/kurum`, `/ogrenci`)

```
src/
  app/
    login/            Telefon + OTP giriş (OTP akışı: actions.ts)
    ogrenci/          Öğrenci: setler, set detayı, sepet, ödeme, siparişler
    admin/            Admin panelleri (kurum, kitap, set, öğrenci, sipariş)
    kurum/            Kurum yetkilisi panelleri
  components/Shell.tsx   Ortak başlık/menü
  lib/
    db.ts             Şema + örnek veri (tek değişiklikle Postgres'e taşınabilir)
    auth.ts/session.ts  Oturum ve rol kontrolü
    queries.ts        Set görünürlüğü, sepet, sipariş sorguları
    sms.ts            SMS/OTP adapteri (mock | netgsm | twilio)
    payment.ts        Ödeme adapteri (mock | iyzico | paytr)
    cargo.ts          Kargo adapteri (mock | aras | yurtici)
```

## Entegrasyonlar (gerçek servise geçiş)

Üç entegrasyon da **adapter** deseniyle yazıldı. Geliştirmede `mock` mod çalışır (OTP konsola yazılır, ödeme otomatik onaylanır, sahte kargo takip no üretilir). Gerçek servise geçmek için `.env` içindeki sağlayıcıyı değiştirip kimlik bilgilerini girin:

- **SMS / OTP** (`SMS_PROVIDER`): `netgsm` veya `twilio`. İlgili API çağrısı `src/lib/sms.ts` içinde hazırdır.
- **Ödeme** (`PAYMENT_PROVIDER`): `iyzico` (checkoutForm) veya `paytr` (iframe token). `src/lib/payment.ts` içindeki `TODO` noktalarına sağlayıcı çağrısını ekleyin; 3D/iframe yönlendirmesi için `redirectUrl` zaten desteklenir.
- **Kargo** (`CARGO_PROVIDER`): `aras` veya `yurtici`. `src/lib/cargo.ts` içindeki `createShipment` çağrısını tamamlayın; sipariş başarılı ödeme sonrası otomatik kargo kaydı oluşturur.

## Üretim notları

- `AUTH_SECRET` değerini güçlü rastgele bir değerle değiştirin.
- `node:sqlite` tek sunucu/geliştirme için uygundur. Çok örnekli üretim için `src/lib/db.ts`'i PostgreSQL/Supabase'e taşıyın; sorgular standart SQL olduğundan değişiklik sınırlıdır.
- OTP kodları 6 haneli, 3 dakika geçerli ve 5 hatalı denemeden sonra geçersizdir.
- Ödeme callback/webhook doğrulaması gerçek sağlayıcıda eklenmelidir (idempotent sipariş güncellemesi).
