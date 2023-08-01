Srt2karaoke
===

From srt generate by [whisper](https://github.com/openai/whisper) command with one word by item, generate a karaoke fromat.

```
whisper "/content/audio.opus" --task transcribe --model large-v2 --verbose False --word_timestamps True --max_line_width 1 --max_line_count 1 --output_dir output
```

