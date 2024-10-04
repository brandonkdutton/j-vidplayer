#!/bin/bash

#USAGE: ./main.sh "https://www.youtube.com/watch?v=P6vrnJmOCp4"

echo "using: $1"

title=$(./dl --print "%(title)s" $1)
echo "Processing: $title"

file_root="videos/${title}/${title}"

mkdir -p videos
mkdir -p "videos/${title}"
rm -f "${file_root}-out.mp4"
rm -f "${file_root}-out.m4a"
rm -f "${file_root}.mp4"
rm -f "${file_root}.m4a"

./dl -f bestaudio[ext=m4a] -o "${file_root}-out.%(ext)s" $1

./dl -f '(best)[ext=mp4][height<=720]' \
-o "${file_root}-out.%(ext)s" $1

ffmpeg -i "${file_root}-out.mp4" -c copy -movflags +faststart "${file_root}-out-2.mp4"
ffmpeg -i "${file_root}-out-2.mp4" -c:v copy -c:a copy ${file_root}.mp4
ffmpeg -i "${file_root}-out.m4a" -c copy -movflags +faststart "${file_root}.m4a"

rm ${file_root}-out-2.mp4
rm "${file_root}-out.mp4"
rm "${file_root}-out.m4a"

echo "${file_root}.mp4"
echo "${file_root}.m4a"