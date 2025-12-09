#!/bin/bash

# Simple alarm sound generator for macOS (no ffmpeg required)
# This creates a placeholder alarm sound using macOS text-to-speech

OUTPUT="app/src/main/res/raw/alarm_sound.mp3"

echo "Generating alarm sound using macOS text-to-speech..."

# Generate spoken warning multiple times
say -v "Alex" -r 200 "Alert. Alert. Alert. Alert. Alert." -o temp_alarm.aiff

# Convert to MP3 using afconvert (built-in macOS tool)
afconvert temp_alarm.aiff -d 0 -f mp4f -b 128000 "$OUTPUT" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ Alarm sound created: $OUTPUT"
    rm temp_alarm.aiff
    echo "Note: This is a voice-based alarm. For a tone-based alarm, install ffmpeg and use the alternative method in BUILD_GUIDE.md"
else
    echo "❌ Failed to convert. Trying direct AIFF..."
    mv temp_alarm.aiff "$OUTPUT.aiff"
    echo "⚠️  Created AIFF file. Android may not support this format."
    echo "   Please convert to MP3 manually or install ffmpeg."
fi

echo ""
echo "To test the sound:"
echo "  afplay $OUTPUT"
