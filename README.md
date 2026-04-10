<div align="center">
  <img src="./assets/images/ourin2.jpg" alt="OURIN MD Banner" width="400" style="border-radius:15px; margin-bottom: 20px;" />
  <br />
  
  <h1>✨ OURIN MD✨</h1>
  <p><strong>Bot WhatsApp Multi-Device Generasi Baru dengan Sistem Plugin Modular & Integrasi Cerdas</strong></p>

  <p align="center">
    <img src="https://img.shields.io/badge/Language-Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
    <img src="https://img.shields.io/badge/Version-v2.3.0-007ACC?style=for-the-badge&logo=bamboo&logoColor=white" />
    <img src="https://img.shields.io/badge/License-MIT-purple?style=for-the-badge" />
    <img src="https://img.shields.io/badge/Maintained%3F-Yes-green.svg?style=for-the-badge" />
  </p>
</div>

---

Halo semuanya! 👋 Selamat datang di repositori resmi **OURIN MD V2.3.0**. 

Buat kamu yang sedang mencari script bot WhatsApp yang ringan, punya fitur super lengkap, tapi gampang banget buat dipasang—kamu berada di tempat yang tepat. OURIN MD didesain khusus agar **profesional, cepat, dan anti-ribet**, cocok dipakai buat belajar, jaga grup, atau pun yang lainnya

> [!TIP]
> Kami memakai pustaka **Baileys** terbaru yang memastikan bot berjalan lebih stabil untuk WhatsApp Multi-Device (bisa aktif di banyak perangkat sekaligus).

## 🛒 Produk OURIN

| Layanan            | Deskripsi                                      | Akses |
|-------------------|-----------------------------------------------|-------|
| Panel Legal       | Panel resmi & aman                            | [Klik](https://cc.ourin.xyz) |
| Custom Script     | Ubah script bot dengan mudah                  | [Klik](https://sc.ourin.xyz/build) |
| Plugin OURIN MD   | Plugin terbaru & update                       | [Klik](https://pl.ourin.xyz) |
| Media Hosting     | Hosting gambar, video, audio, file            | [Klik](https://up.ourin.xyz) |

---

## 🌟 Kenapa Memilih OURIN MD?

| Fitur | Penjelasan |
| :--- | :--- |
| **🤖 Teknologi AI Terbaru** | Sudah terintegrasi dengan Google Gemini, Groq, dan asisten pintar lainnya. Ngobrol sama bot rasanya kayak ngobrol sama manusia sungguhan! |
| **🧩 Sistem Plugin Modular** | Nggak perlu pusing mikirin kodingan panjang. Fitur dibagi per file (*folder plugins*). Gampang ditambah, gampang dihapus. |
| **🎮 RPG & Ekosistem Game** | Bikin grup WhatsApp-mu hidup dengan sistem Leveling, Kuis, Energi, Uang (Koin), hingga sistem Clan/Guild. |
| **☁️ Dukungan Pterodactyl & VPS** | Terintegrasi penuh dengan panel Pterodactyl dan Vercel. Punya server digital ocean? Bisa di-manage langsung lewat WA. |

<details>
<summary><b>👀 Lihat Fitur Tambahan Lainnya (Klik untuk Membuka)</b></summary>
Kami menyertakan berbagai fitur seru meskipun mungkin kamu hanya menggunakannya sesekali:
<ul>
  <li><b>Canvas Image Editor:</b> Buat meme dan lainnya langsung dari bot.</li>
  <li><b>Fitur Islami & Religi:</b> Pengingat sholat, tafsir, dan bacaan Al-Qur'an.</li>
  <li><b>Animasi & Ephoto:</b> Manipulasi foto menjadi ala anime atau efek keren lainnya.</li>
  <li><b>Anti-Spam & Keamanan Grup:</b> Bot otomatis kick member yang kirim link ilegal, dsb.</li>
  <li><b>Push Kontak (Marketing):</b> Khusus untuk promosi bisnis dengan sistem <i>broadcast</i> masal secara aman.</li>
</ul>
</details>

---

## ⚙️ Persyaratan Sistem

Sebelum mulai menjalankan bot impianmu, pastikan komputer/server kamu sudah memenuhi syarat ini ya:

- **Node.js** (Wajib versi >= 22.0.0, **Rekomendasi pakai Node.JS versi 24.x.x LTS**). Kamu bisa [download di sini](https://nodejs.org/).
- **Git** (Wajib untuk mengunduh script bot ini). [Download Git untuk Windows/Mac](https://git-scm.com/downloads) | Pengguna Termux: `pkg install git`
- **FFmpeg** (Wajib agar bot bisa bikin sticker & olah video). [Panduan Install FFmpeg Windows/Linux](https://ffmpeg.org/download.html).

> [!WARNING]
> Jika `FFmpeg` tidak terinstall, fitur pembuat stiker gambar bergerak/video **tidak akan berfungsi**. Pastikan sudah terpasang dengan benar.

---

## 🚀 Panduan Instalasi (Langkah Demi Langkah)

Tenang saja, konfigurasinya sangat gampang walau kamu baru belajar! Kami mendukung sistem Windows, Panel Pterodactyl, Docker, hingga Termux!

### 1. Ambil Source Code
Buka terminal (Command Prompt/Git Bash/Termux) lalu jalankan:

```bash
git clone https://github.com/LuckyArch/OurinMD.git
cd OurinMD
```

---

### 🐧 Khusus Pengguna Termux / Linux
Kami sediakan script otomatis buat kamu biar gak pusing install modul tambahan (karena fitur canvas/sharp butuh dependensi C++). Cukup jalankan:
```bash
bash install.sh
```

---

### 🐳 Menggunakan Docker (Tinggal Pakai)
Buat kamu yang pakai VPS dan ogah ribet, fitur ini sangat direkomendasikan karena sudah dibundle dengan environment terbaik (Node 22 Bookworm):
```bash
docker build -t ourin-md .
docker run -d --name ourin-bot ourin-md
```

---

### ⚙️ Instalasi Manual (Windows / Lainnya)
Jika kamu tidak menggunakan Termux atau Docker, ikuti tahap instalasi standar ini:

### 2. Instal Dependensi (Module)
Selanjutnya, kita install dulu semua alat-alat tempurnya:

```bash
npm install
```
*(Proses ini memakan waktu beberapa menit tergantung koneksi internetmu)*

### 3. Konfigurasi `config.js`
> [!IMPORTANT]
> Jangan lupa untuk mengedit file `config.js`. File ini adalah "jantung" dari bot kamu.
Buka `config.js` favoritmu dengan teks editor, sesuaikan nomor WhatsApp kamu (sebagai Owner), Nama bot, Versi Bot, dan lainnya

> [!IMPORTANT]
> Jangan lupa mengisi **Pairing Number** di `config.js` dengan nomor WhatsApp bot kamu! berawalan dari 62, kalau indonesia jangan pakai 0.

```javascript
    session: {
        pairingNumber: '62xxxxxxxxx',   // ini jangan lupa diisi ya, pakai nomor bot kamu
        usePairingCode: true // true = pakai Pairing Code, false = pakai QR Code
    },
```

### 4. Nyalakan Bot-nya!
Setelah semuanya ter-install, jalankan perintah ini:

```bash
npm start
```
Bot nanti akan otomatis berjalan, kalau sampai disuruh pairing code
code pairingnya **OURINNAI**

### 5. Menghubungkan WhatsApp
Saat pertama kali dijalankan, sistem bot cerdas akan meminta kamu. 
Bot akan mengirimkan **Pairing Code** (OURINNAI). Cukup masukkan kode ini di aplikasi WhatsApp kamu `(Perangkat Tertaut -> Tautkan dengan Nomor Telepon)`, tempel kode OURINNAI di 8 kolom itu.

---

## 💡 Info & Tips Menarik

> [!NOTE] 
> Ingin deploy bot agar bisa jalan 24 jam nonstop?
Kamu bisa menggunakan layanan **Panel Pterodactyl**, untuk tutorial, bisa nonton di yutub (aku belum buat tutorialnya xixixixi :b)

## 🤝 Kontribusi

Sistem kami `Open Source`. Jika ada *bugs* (celah error) atau ingin menabahkan *plugin* seru karya sendiri:
1. `Fork` repo ini.
2. Lakukan perubahan kamu.
3. Kirimkan `Pull Request`. Kami dengan senang hati menyambut karya terbaikmu!

---

<div align="center">
  <b>Dibuat dengan ❤️ oleh Zann</b>
  <p>Jangan lupa kasih ⭐ (Star) pada repo ini jika kamu merasa terbantu!</p>
</div>
