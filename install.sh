#!/usr/bin/env bash

W='\033[1;37m'
G='\033[1;32m'
R='\033[1;31m'
Y='\033[1;33m'
C='\033[1;36m'
P='\033[1;35m'
DIM='\033[2m'
NC='\033[0m'
CLR='\033[K'

LOGDIR="${TMPDIR:-${PREFIX:-/usr}/tmp}"
LOGFILE="$LOGDIR/ourin_install.log"
> "$LOGFILE"

clear

echo -e "${P}"
cat << "EOF"
  ██████╗ ██╗   ██╗██████╗ ██╗███╗   ██╗    ███╗   ███╗██████╗ 
 ██╔═══██╗██║   ██║██╔══██╗██║████╗  ██║    ████╗ ████║██╔══██╗
 ██║   ██║██║   ██║██████╔╝██║██╔██╗ ██║    ██╔████╔██║██║  ██║
 ██║   ██║██║   ██║██╔══██╗██║██║╚██╗██║    ██║╚██╔╝██║██║  ██║
 ╚██████╔╝╚██████╔╝██║  ██║██║██║ ╚████║    ██║ ╚═╝ ██║██████╔╝
  ╚═════╝  ╚═════╝ ╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝    ╚═╝     ╚═╝╚═════╝
EOF
echo -e "${NC}"
echo -e "  ${DIM}Auto Installer v2.3.0${NC}"
echo ""

run_task() {
    local label="$1"
    shift
    local cmd="$@"
    local frames='|/-\'
    local pct=0
    local i=0

    eval "$cmd" >> "$LOGFILE" 2>&1 &
    local pid=$!

    while kill -0 $pid 2>/dev/null; do
        local f=${frames:i%4:1}
        if [ $pct -lt 95 ]; then
            pct=$((pct + RANDOM % 5 + 1))
            [ $pct -gt 95 ] && pct=95
        fi
        printf "\r${CLR}  ${Y}${f}${NC}  ${W}%-36s${NC} ${C}%3d%%${NC}" "$label" "$pct" 2>/dev/null
        sleep 0.3
        i=$((i + 1))
    done

    wait $pid
    local code=$?

    if [ $code -eq 0 ]; then
        printf "\r${CLR}  ${G}✓${NC}  ${W}%-36s${NC} ${G}100%%${NC}\n" "$label"
    else
        printf "\r${CLR}  ${R}✗${NC}  ${W}%-36s${NC} ${R}error${NC}\n" "$label"
    fi

    return $code
}

echo -e "  ${W}Mengecek OS kamu...${NC}"
echo ""

if command -v pkg &> /dev/null; then
    echo -e "  ${G}✓${NC}  ${W}Terdeteksi: ${C}Termux (Android)${NC}"
    echo ""

    export DEBIAN_FRONTEND=noninteractive

    run_task "Update repository Termux" "pkg update -y"
    run_task "Instal Node.js" "pkg install -y nodejs"
    run_task "Instal FFmpeg" "pkg install -y ffmpeg"
    run_task "Instal Git" "pkg install -y git"
    run_task "Instal Python" "pkg install -y python"
    run_task "Instal C++ Compiler" "pkg install -y clang binutils build-essential"
    run_task "Instal libvips" "pkg install -y libvips"

    export CC=clang
    export CXX=clang++
    export npm_config_sharp_build_from_source=true
    export npm_config_build_from_source=true

elif command -v apt-get &> /dev/null; then
    echo -e "  ${G}✓${NC}  ${W}Terdeteksi: ${C}Ubuntu / Debian${NC}"
    echo ""

    run_task "Update repository apt" "sudo apt-get update -y"
    run_task "Instal FFmpeg" "sudo apt-get install -y ffmpeg"
    run_task "Instal Git" "sudo apt-get install -y git"
    run_task "Instal Build Tools" "sudo apt-get install -y build-essential python3 curl"
    run_task "Instal libvips-dev" "sudo apt-get install -y libvips-dev"

    if ! command -v node &> /dev/null; then
        run_task "Setup repo Node.js 22" "curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -"
        run_task "Instal Node.js" "sudo apt-get install -y nodejs"
    fi

elif command -v pacman &> /dev/null; then
    echo -e "  ${G}✓${NC}  ${W}Terdeteksi: ${C}Arch Linux${NC}"
    echo ""

    run_task "Update sistem" "sudo pacman -Syu --noconfirm"
    run_task "Instal Node.js & NPM" "sudo pacman -S --noconfirm nodejs npm"
    run_task "Instal FFmpeg & Git" "sudo pacman -S --noconfirm ffmpeg git"
    run_task "Instal Build Tools" "sudo pacman -S --noconfirm base-devel python vips"
else
    echo -e "  ${R}✗${NC}  ${W}OS tidak dikenali, instal manual ya.${NC}"
    exit 1
fi

echo ""
NODE_VER=$(node -v 2>/dev/null || echo "?")
NPM_VER=$(npm -v 2>/dev/null || echo "?")
GIT_VER=$(git --version 2>/dev/null | cut -d' ' -f3 || echo "?")

echo -e "  ${G}✓${NC}  ${W}Node ${C}${NODE_VER}${NC}  |  ${W}NPM ${C}v${NPM_VER}${NC}  |  ${W}Git ${C}v${GIT_VER}${NC}"
echo ""
echo -e "  ${W}Mulai npm install, agak lama ya sabar...${NC}"
echo ""

run_task "Download semua module bot" "npm install"
NPM_EXIT=$?

echo ""

if [ $NPM_EXIT -eq 0 ]; then
    echo -e "  ${G}✓${NC}  ${W}Selesai! Edit ${C}config.js${W} dulu, terus ketik ${Y}npm start${NC}"
else
    echo -e "  ${R}✗${NC}  ${W}npm install gagal. Ini error terakhirnya:${NC}"
    echo ""
    tail -15 "$LOGFILE" 2>/dev/null
    echo ""
    echo -e "  ${DIM}Log lengkap: $LOGFILE${NC}"
fi

echo ""
