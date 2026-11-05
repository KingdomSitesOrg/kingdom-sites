#!/usr/bin/env bash
# Encodes the home page film (LaptopFilm.tsx) as two short H.264 videos, one
# for a computer and one for a phone held upright, from the rendered frames in
# public/film/{desktop,phone}/. Every browser, iPhones included, decodes H.264
# in hardware, which is far lighter than unpacking and painting the frames.
#
# Only frames 1-87 are used: the camera comes to rest on 87 (see END_FRAME in
# LaptopFilm.tsx). They play at 29 frames a second, so the film lasts the 3 s
# the lid takes to open (FPS in LaptopFilm.tsx must match).
#
# Quality 20 (crf) looks the same as the frames side by side (SSIM about 0.97
# against the frames, PSNR about 41 dB). The colours are converted from the
# frames' full-range JPEG to the video's standard range and tagged BT.709, so
# browsers show them unchanged.
#
# usage: scripts/film/encode_video.sh        (FFMPEG=/path/to/ffmpeg to choose one)
set -euo pipefail
cd "$(dirname "$0")/../.."
FFMPEG="${FFMPEG:-ffmpeg}"
FRAMES=87
FPS=29
CRF=20
for kind in desktop phone; do
  "$FFMPEG" -hide_banner -loglevel error -y \
    -framerate "$FPS" -start_number 1 -i "public/film/$kind/%04d.jpg" -frames:v "$FRAMES" \
    -vf "scale=in_range=full:out_range=tv:out_color_matrix=bt709:flags=lanczos+accurate_rnd+full_chroma_int,format=yuv420p" \
    -c:v libx264 -preset veryslow -crf "$CRF" -profile:v high -level:v 4.1 -tune film \
    -color_range tv -colorspace bt709 -color_primaries bt709 -color_trc bt709 \
    -movflags +faststart -an "public/film/$kind.mp4"
  echo "public/film/$kind.mp4 $(stat -c%s "public/film/$kind.mp4") bytes"
done
