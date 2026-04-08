/**
 * Claude API tool definitions for THE LUTHIER
 * Converted from MCP server Zod schemas to Claude tool_use JSON Schema format
 */

const TOOLS = [
  {
    name: 'list_sequences',
    description: 'List all sequences in the Premiere Pro project',
    input_schema: { type: 'object', properties: {}, required: [] }
  },
  {
    name: 'find_sequence',
    description: 'Find a sequence by name (supports fuzzy matching and letter code lookup)',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Sequence name or letter code to search for' }
      },
      required: ['name']
    }
  },
  {
    name: 'get_clips_in_range',
    description: 'Get all clips overlapping a sequence timecode range',
    input_schema: {
      type: 'object',
      properties: {
        sequence_name: { type: 'string', description: 'Source sequence name' },
        tc_in: { type: 'string', description: 'Start timecode HH:MM:SS:FF' },
        tc_out: { type: 'string', description: 'End timecode HH:MM:SS:FF' }
      },
      required: ['sequence_name', 'tc_in', 'tc_out']
    }
  },
  {
    name: 'get_transcript_for_range',
    description: 'Get transcript text from Premiere speech-to-text for a timecode range',
    input_schema: {
      type: 'object',
      properties: {
        sequence_name: { type: 'string', description: 'Source sequence name' },
        tc_in: { type: 'string', description: 'Start timecode HH:MM:SS:FF' },
        tc_out: { type: 'string', description: 'End timecode HH:MM:SS:FF' }
      },
      required: ['sequence_name', 'tc_in', 'tc_out']
    }
  },
  {
    name: 'get_word_level_timing',
    description: 'Get word-by-word timecodes for precise cutting',
    input_schema: {
      type: 'object',
      properties: {
        sequence_name: { type: 'string', description: 'Source sequence name' },
        tc_in: { type: 'string', description: 'Start timecode HH:MM:SS:FF' },
        tc_out: { type: 'string', description: 'End timecode HH:MM:SS:FF' }
      },
      required: ['sequence_name', 'tc_in', 'tc_out']
    }
  },
  {
    name: 'get_sequence_contents',
    description: 'Get full manifest of all clips in a sequence (all tracks, all clips with timecodes)',
    input_schema: {
      type: 'object',
      properties: {
        sequence_name: { type: 'string', description: 'Sequence name' }
      },
      required: ['sequence_name']
    }
  },
  {
    name: 'create_sequence',
    description: 'Create a new empty sequence (placed in RADIO EDITS bin)',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'New sequence name' },
        settings_from: { type: 'string', description: 'Copy settings from this sequence name' }
      },
      required: ['name']
    }
  },
  {
    name: 'add_to_sequence',
    description: 'Insert a timecode range from a source sequence into the target sequence. This is the primary tool for placing clips on a timeline.',
    input_schema: {
      type: 'object',
      properties: {
        target_sequence: { type: 'string', description: 'Target sequence name (the edit being built)' },
        source_sequence: { type: 'string', description: 'Source sequence name (the footage to pull from)' },
        tc_in: { type: 'string', description: 'Start timecode HH:MM:SS:FF in the source' },
        tc_out: { type: 'string', description: 'End timecode HH:MM:SS:FF in the source' },
        insert_at: { type: 'string', description: 'Timecode in target, or "END" to append (default: END)' }
      },
      required: ['target_sequence', 'source_sequence', 'tc_in', 'tc_out']
    }
  },
  {
    name: 'copy_to_v2',
    description: 'Copy clips from V1 to V2 in source sequence to mark what was used',
    input_schema: {
      type: 'object',
      properties: {
        sequence_name: { type: 'string', description: 'Source sequence name' },
        tc_in: { type: 'string', description: 'Start timecode HH:MM:SS:FF' },
        tc_out: { type: 'string', description: 'End timecode HH:MM:SS:FF' },
        blk_label: { type: 'string', description: 'Label for the marker (e.g., "BLK 01")' }
      },
      required: ['sequence_name', 'tc_in', 'tc_out']
    }
  },
  {
    name: 'add_marker',
    description: 'Add a marker to a sequence at a specific timecode with a name, color, and optional comment',
    input_schema: {
      type: 'object',
      properties: {
        sequence_name: { type: 'string', description: 'Sequence name' },
        tc: { type: 'string', description: 'Timecode for the marker HH:MM:SS:FF' },
        name: { type: 'string', description: 'Marker name' },
        color: { type: 'string', enum: ['green', 'red', 'blue', 'yellow', 'orange', 'purple', 'white'], description: 'Marker color (default: green)' },
        comment: { type: 'string', description: 'Marker comment' }
      },
      required: ['sequence_name', 'tc', 'name']
    }
  },
  {
    name: 'parse_script',
    description: 'Parse a Google Docs HTML export of the script into structured JSON with blocks, selects, timecodes, and strikethrough detection',
    input_schema: {
      type: 'object',
      properties: {
        file_path: { type: 'string', description: 'Path to the HTML file (Google Docs export)' }
      },
      required: ['file_path']
    }
  },
  {
    name: 'verify_transcript_match',
    description: 'Compare script text against Premiere transcript text and return similarity score (0-1)',
    input_schema: {
      type: 'object',
      properties: {
        script_text: { type: 'string', description: 'Text from the script' },
        premiere_text: { type: 'string', description: 'Text from Premiere transcript' }
      },
      required: ['script_text', 'premiere_text']
    }
  },
  {
    name: 'health_check',
    description: 'Check connection to Premiere Pro via the CEP extension. Returns project name, sequence count, and connection status.',
    input_schema: { type: 'object', properties: {}, required: [] }
  },
  {
    name: 'decode_prproj_transcripts',
    description: 'Extract speech-to-text transcripts directly from a .prproj file. Use this to search for specific spoken content across all footage in the project. Returns clip names, speakers, word counts, and full transcript text.',
    input_schema: {
      type: 'object',
      properties: {
        prproj_path: { type: 'string', description: 'Full path to the .prproj file' },
        search_text: { type: 'string', description: 'Optional: filter transcripts containing this text (case-insensitive)' },
        max_results: { type: 'number', description: 'Maximum number of transcripts to return (default: 20)' }
      },
      required: ['prproj_path']
    }
  }
];

module.exports = { TOOLS };
