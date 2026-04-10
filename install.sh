#!/usr/bin/env bash

CYAN='\033[0;36m'
GREEN='\033[1;32m'
RED='\033[1;31m'
YELLOW='\033[1;33m'
PURPLE='\033[1;35m'
NC='\033[0m'

clear

echo -e "${PURPLE}"
cat << "EOF"
  ██████╗ ██████╗ ██████╗ ██╗███╗   ██╗    ███╗   ███╗██████╗
 ██╔═══██╗██╔══██╗██╔═══██╗██║████╗  ██║    ████╗ ████║██╔══██╗
 ██║   ██║██║  ██║██████╔╝██║██╔██╗ ██║    ██╔████╔██║██║  ██║
 ██║   ██║██║  ██║██╔══██╗██║██║╚██╗██║    ██║╚██╔╝██║██║  ██║
 ╚██████╔╝╚██████╔╝██║  ██║██║██║ ╚████║    ██║ ╚═╝ ██║██████╔╝
  ╚═════╝  ╚═════╝ ╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝    ╚═╝     ╚═╝╚═════╝
EOF
echo -e "${NC}"

echo -e "${CYAN}[*] Menyiapkan auto installer...${NC}\n"
sleep 1

show_progress() {
    local pid=$1
    local text=$2
    local progress=0
    local speed=2
    
    while [ "$(ps a | awk '{print $1}' | grep -w $pid)" ]; do
        if [ $progress -lt 99 ]; then
            progress=$((progress + speed))
        fi
        
        printf "\r${YELLOW}[!] %-35s : [%-20s] %d%%${NC}" "$text" "$(printf '#%.0s' $(seq 1 $((progress / 5))))" "$progress"
        sleep 0.5
    done
    
    wait $pid
    printf "\r${GREEN}[✔] %-35s : [%-20s] 100%%${NC}\n" "$text" "$(printf '#%.0s' $(seq 1 20))"
}

printf "\r${YELLOW}[!] Mengecek OS kamu                  : [                    ] 0%%${NC}"
sleep 1
printf "\r${YELLOW}[!] Mengecek OS kamu                  : [##########          ] 50%%${NC}"
sleep 1
printf "\r${GREEN}[✔] Mengecek OS kamu                  : [####################] 100%%${NC}\n"

if command -v pkg &> /dev/null; then
    echo -e "\n${CYAN}[*] OS Terdeteksi: Termux (Android)${NC}"
    
    pkg update -y > /dev/null 2>&1 & 
    show_progress $! "Update server Termux"
    
    pkg upgrade -y > /dev/null 2>&1 & 
    show_progress $! "Upgrade library lokal"
    
    pkg install nodejs -y > /dev/null 2>&1 & 
    show_progress $! "Menginstal Node.JS"
    
    pkg install ffmpeg -y > /dev/null 2>&1 & 
    show_progress $! "Menginstal FFmpeg"
    
    pkg install binutils clang libvips git build-essential python -y > /dev/null 2>&1 & 
    show_progress $! "Menginstal pendukung (C++ Compiler)"
    
elif command -v apt-get &> /dev/null; then
    echo -e "\n${CYAN}[*] OS Terdeteksi: Ubuntu / Debian / VPS Linux${NC}"
    
    sudo apt-get update -y > /dev/null 2>&1 & 
    show_progress $! "Update repository apt"
    
    sudo apt-get install -y curl ffmpeg libvips-dev build-essential python3 git > /dev/null 2>&1 & 
    show_progress $! "Menginstal library utama"

    if ! command -v node &> /dev/null; then
        curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - > /dev/null 2>&1 &
        show_progress $! "Mengambil Node.js repo"
        
        sudo apt-get install -y nodejs > /dev/null 2>&1 & 
        show_progress $! "Menginstal Node.js versi terbaru"
    fi

elif command -v pacman &> /dev/null; then
    echo -e "\n${CYAN}[*] OS Terdeteksi: Arch Linux${NC}"
    sudo pacman -Syu --noconfirm > /dev/null 2>&1 & 
    show_progress $! "Mendownload update Arch"
    
    sudo pacman -S --noconfirm nodejs npm ffmpeg vips base-devel python git > /dev/null 2>&1 & 
    show_progress $! "Menginstal Node dan kawan2"
else
    echo -e "${RED}\n[X] OS tidak dikenali! Tolong instal manual.${NC}"
    sleep 2
    exit 1
fi

echo -e "\n${GREEN}[✔] Mantap! Semua module dasar berhasil tersetting.${NC}\n"

echo -e "\n${CYAN}[*] Mengecek versi node...${NC}\n"
node -v

echo -e "\n${CYAN}[*] Mengecek versi npm...${NC}\n"
npm -v

echo -e "\n${GREEN}[✔] Mantap! Semua module dasar berhasil tersetting.${NC}\n"

# Perbaikan khusus Termux untuk package "sharp" & "canvas"
if command -v pkg &> /dev/null; then
    export npm_config_build_from_source=true
fi

npm install > /dev/null 2>&1 & 
show_progress $! "Mengunduh module bot (NPM Local)"

echo -e "\n${PURPLE}===============================================${NC}"
echo -e "${GREEN}        [✔] INSTALASI BOT SELESAI [✔]          ${NC}"
echo -e "${PURPLE}===============================================${NC}"
echo -e "${CYAN}    Silakan ubah nomormu di config.js          ${NC}"
echo -e "${CYAN}    Lalu nyalakan bot dengan ketik:            ${NC}"
echo -e "${YELLOW}                   npm start                   ${NC}"
echo -e "${PURPLE}===============================================${NC}\n"
