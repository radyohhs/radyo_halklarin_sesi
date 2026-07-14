# Halkların Sesi Radyosu

GitHub Pages için hazırlanmış statik radyo sitesi.

## Yayınlama

1. ZIP dosyasını bilgisayarında aç.
2. İçindeki dosyaları `radyo_halklarin_sesi` GitHub reposunun kök dizinine yükle.
3. GitHub reposunda `Settings > Pages` bölümüne gir.
4. `Deploy from a branch`, `main`, `/ (root)` seçeneklerini seç.
5. Site adresi:
   `https://radyohhs.github.io/radyo_halklarin_sesi/`

## Şarkı ekleme

`songs.json` dosyasına yeni kayıt ekle:

```json
{
  "time": "12:00",
  "program": "Program Adı",
  "title": "Şarkı Adı",
  "artist": "Sanatçı",
  "url": "https://.../sarki.mp3",
  "cover": "assets/images/covers/kapak.jpg",
  "live": false
}
```

Kapak görselini `assets/images/covers/` klasörüne yükle.

## Önemli

- `index.html` dosyasının adı değişmemeli.
- Dosya yollarında Türkçe karakter ve boşluk kullanmamak daha güvenlidir.
- Sohbet alanı şu anda yalnızca tarayıcı içi demodur. Gerçek sohbet için backend/Firebase gerekir.
- Dinleyici sayısı şu anda demo amaçlıdır. Gerçek sayı için sunucu tarafı gerekir.
