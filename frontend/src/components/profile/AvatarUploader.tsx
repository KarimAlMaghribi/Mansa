import React, { useCallback, useState } from 'react';
import { Box, Button, IconButton } from '@mui/material';
import Avatar from '@mui/material/Avatar';
import DeleteIcon from '@mui/icons-material/Delete';
import { useDropzone } from 'react-dropzone';
import Cropper, { Area } from 'react-easy-crop';
import { Control, useController } from 'react-hook-form';
import { getCroppedImg } from './cropHelpers';

interface AvatarUploaderProps {
  name: string;
  control: Control<any>;
}

export const AvatarUploader = ({ name, control }: AvatarUploaderProps) => {
  const {
    field: { value, onChange },
  } = useController({ name, control });

  const [preview, setPreview] = useState<string>('');
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
      onChange(file);
    }
  }, [onChange]);

  const { getRootProps, getInputProps } = useDropzone({ onDrop, accept: { 'image/*': [] } });

  const handleCropComplete = useCallback((_croppedArea: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleSaveCrop = async () => {
    if (!preview || !croppedAreaPixels) return;
    const blob = await getCroppedImg(preview, croppedAreaPixels);
    onChange(blob);
    setPreview(URL.createObjectURL(blob));
  };

  const handleDelete = () => {
    onChange(null);
    setPreview('');
  };

  return (
    <Box>
      {preview ? (
        <Box position="relative" width={200} height={200}>
          <Cropper
            image={preview}
            crop={crop}
            zoom={zoom}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={handleCropComplete}
            aspect={1}
          />
          <Box display="flex" justifyContent="space-between" mt={1}>
            <Button size="small" onClick={handleSaveCrop}>Crop</Button>
            <IconButton color="error" onClick={handleDelete} aria-label="delete avatar">
              <DeleteIcon />
            </IconButton>
          </Box>
        </Box>
      ) : (
        <Box {...getRootProps()} sx={{ border: '1px dashed', p: 2, textAlign: 'center' }}>
          <input {...getInputProps()} />
          <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 1 }} />
          <Button variant="text">Bild hochladen</Button>
        </Box>
      )}
    </Box>
  );
};
