# Naval Letter Data Package (NLDP) Feature

## Overview

The Naval Letter Data Package (NLDP) feature enables users to share correspondence data between instances of the Naval Letter Formatter application. This functionality allows for collaborative editing, template sharing, and data backup/restore operations.

## File Format Specification

### File Extension
- **Extension**: `.nldp`
- **MIME Type**: `application/json`
- **Format**: JSON-based structured data

### File Structure

```json
{
  "metadata": {
    "packageId": "unique_identifier",
    "formatVersion": "1.0.0",
    "createdAt": "2024-08-30T14:30:00.000Z",
    "author": {
      "name": "Author Name",
      "unit": "Organization",
      "email": "author@example.com"
    },
    "package": {
      "title": "Package Title",
      "description": "Package Description",
      "subject": "Letter Subject",
      "documentType": "basic|endorsement",
      "tags": ["tag1", "tag2"]
    },
    "checksums": {
      "dataHash": "sha256_hash",
      "crc32": "crc32_checksum"
    }
  },
  "data": {
    "formData": { /* All form fields */ },
    "vias": ["via entries"],
    "references": ["reference entries"],
    "enclosures": ["enclosure entries"],
    "copyTos": ["copy-to entries"],
    "paragraphs": [{ /* paragraph objects */ }]
  }
}
```

## Features

### Data Integrity
- **SHA-256 Hashing**: Ensures data hasn't been corrupted
- **CRC32 Checksums**: Quick integrity verification
- **Format Validation**: Comprehensive structure validation

### Version Control
- **Format Versioning**: Supports backward compatibility
- **Migration Support**: Handles format updates gracefully
- **Compatibility Checking**: Warns about version mismatches

### Security
- **Data Sanitization**: Cleans imported data to prevent issues
- **Optional Personal Info**: Control over sensitive data inclusion
- **Input Validation**: Prevents malformed data injection

### User Experience
- **Drag & Drop Support**: Easy file import (future enhancement)
- **Progress Indicators**: Loading states for import/export
- **Error Handling**: Clear error messages and recovery options
- **Metadata Management**: Rich package information

## Usage

### Exporting Data

1. Click "Export Data Package" button
2. Fill in package information:
   - **Title**: Descriptive name for the package
   - **Description**: Optional detailed description
   - **Author Info**: Your name and unit (optional)
   - **Personal Info**: Choose whether to include contact details
3. Click "Export" to download the .nldp file

### Importing Data

1. Click "Import Data Package" button
2. Select a .nldp file from your computer
3. The system will:
   - Validate the file format
   - Check data integrity
   - Load the data into your interface
   - Display any warnings or errors

### File Management

**Recommended Practices:**
- Use descriptive filenames: `LETTER_Training_Schedule_2024-08-30.nldp`
- Include version info in descriptions for important documents
- Backup important letters as NLDP files before major edits
- Share NLDP files via secure channels only

## Integration with Existing Workflows

### Save/Load System
- NLDP complements the existing localStorage save system
- Provides portable backup option
- Enables sharing between different computers/users

### Document Generation
- Import NLDP → Edit → Generate DOCX workflow
- Template sharing for standardized correspondence
- Collaboration on complex multi-endorsement packages

### Data Migration
- Export from old systems via NLDP format
- Bulk import of correspondence templates
- Archive storage with full metadata

## API Reference

### Core Functions

```typescript
// Create NLDP file from current data
createNLDPFile(formData, vias, references, enclosures, copyTos, paragraphs, config): Promise<string>

// Import and validate NLDP file
importNLDPFile(fileContent: string): NLDPImportResult

// Validate file structure
validateNLDPFile(fileContent: string): NLDPValidationResult

// Generate safe filename
generateNLDPFilename(subject: string, documentType: string): string
```

### React Hook

```typescript
const {
  exportToNLDP,
  importFromNLDP,
  triggerFileImport,
  isExporting,
  isImporting,
  lastError,
  lastSuccess,
  clearMessages
} = useNLDP();
```

### Component Integration

```tsx
<NLDPFileManager
  formData={formData}
  vias={vias}
  references={references}
  enclosures={enclosures}
  copyTos={copyTos}
  paragraphs={paragraphs}
  onDataImported={(data) => { /* handle import */ }}
/>
```

## Error Handling

### Common Errors
- **Invalid File Format**: File is not valid JSON or missing required fields
- **Version Incompatibility**: File format is newer than supported version
- **Data Corruption**: Checksum mismatch indicating corrupted data
- **Missing Required Fields**: Essential data fields are empty or missing

### Recovery Strategies
- **Partial Import**: Import valid portions of corrupted files
- **Data Sanitization**: Clean problematic data during import
- **Fallback Values**: Provide defaults for missing required fields
- **User Guidance**: Clear instructions for resolving issues

## Security Considerations

### Data Privacy
- Personal information (email) is optional in exports
- No automatic transmission of data to external services
- Local file-based sharing only

### Data Validation
- All imported data is sanitized before use
- Paragraph levels are clamped to valid ranges (1-8)
- Array fields are validated for proper structure
- Required fields are checked and defaulted if missing

### File Integrity
- SHA-256 hashing prevents silent corruption
- CRC32 provides quick integrity checks
- Format validation ensures structural correctness

## Future Enhancements

### Planned Features
- **Drag & Drop Import**: Direct file drop onto interface
- **Batch Operations**: Import/export multiple files
- **Template Gallery**: Shared repository of common templates
- **Version History**: Track changes to shared documents
- **Digital Signatures**: Cryptographic verification of authorship

### API Extensions
- **Cloud Storage Integration**: Direct save/load from cloud services
- **Real-time Collaboration**: Multiple users editing simultaneously
- **Audit Trails**: Track who made what changes when
- **Automated Backups**: Scheduled NLDP exports

## Examples

See `examples/sample-training-schedule.nldp` for a complete example of the NLDP format with realistic naval correspondence data.

## Support

For issues with NLDP functionality:
1. Check file format validation errors
2. Verify data integrity checksums
3. Review browser console for detailed error messages
4. Report persistent issues with sample files for reproduction