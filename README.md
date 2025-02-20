# J - vidplayer

**Automation tools to extract the most useful Japanese vocabulary from YouTube videos saving you time and allowing you to focus on your Japanese language studies.**

## Problem Statement

When I arrived in Japan, I realized that nearly all of the 1,000 Japanese words I had memorized weren’t practical for everyday communication. I needed a way to pinpoint the most useful words for daily use, so I could concentrate on learning them instead.

My solution: leverage AI to transcribe Japanese YouTube videos, then use Python code to parse the words into their dictionary forms (a non-trivial task in Japanese). The output is saved as a subtitle file that integrates definitions from [jisho.org](https://jisho.org), all viewable in a custom video player.

## Required Prerequisite

For these tools to work you need to build the cli version of [Ichiran](https://github.com/tshatrov/ichiran) and have its containerized database running in the background.

1. Build the cli version of [Ichiran](https://github.com/tshatrov/ichiran) as per the instructions in its readme.
2. Name the built binary "ichiran-cli" and put it in the ichiran directory of this project, replacing the existing binary.
3. In order these tools to work ichiran's database needs to be running in the background and ichiran-cli needs to be able to connect to it.

## Setup

1. **Transcribe the Video**  
   Use an AI transcribing service like [Turboscribe](https://turboscribe.ai/) or [OpenAI's whisper v3-large model](https://github.com/openai/whisper) to generate both `.txt` and `.srt` transcript files for a YouTube video of your choice. Both formats are required for proper parsing since japanese doesn't use spaces which makes the process more complicated.

2. **Configure the Parser**  
   Open `ichiran/parse_srt_file.py`, locate the main function at the bottom, and update the `srt_file_path` and `txt_file_path` variables to point to your transcribed `.txt` and `.srt` files.

3. **Generate the Subtitles**  
    Run the script with:

   ```bash
   python3 ichiran/parse_srt_file.py

   ```

   This will generate a .subtitles file containing the parsed result that can be viewed in the video player.

4. **Install Dependencies**  
   Navigate to the app directory and install the required dependencies with Yarn:
   ```bash
   cd app
   yarn install
   ```
5. **Run the application**  
   Start the development server by running:
   ```bash
   yarn dev
   ```
   Then open your browser and navigate to http://localhost:3000.
6. **Upload your .subtitles file**  
   On the web interface, upload your video file along with the generated subtitles file.

## Usage

- As the video plays, the subtitles are displayed below the video.

- Each parsed word appears in a list underneath the subtitles.

- Tap on any word to open [jisho.org](https://jisho.org) and view its definition. Note that each word will be in its dictionary form which may differ significantly from how it's conjugated in the subtitles. To resolve any confusion from this simply mouse-over (desktop) or tap and hold (mobile) a word to highlight it in the subtitles.

## Demo

![image](/assets/demo1.png) ![image](/assets/demo2.png)

## Credits

- Text parser uses [Ichiran](https://github.com/tshatrov/ichiran) for the first stage of the parsing process
- Dictionary definitions page uses [Jisho.org](https://jisho.org)
- Demo shows video by [さんのみやすず](https://www.youtube.com/watch?v=UT3XED3Wbw4)
