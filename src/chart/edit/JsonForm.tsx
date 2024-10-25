import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, FormControl, InputLabel, Select, MenuItem, Switch, FormControlLabel } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers'; // Correct import for DatePicker
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'; // Correct import for AdapterDateFns
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

const JsonForm = ({ nodeProperties, selections, onSubmit }) => {
  const [formData, setFormData] = useState({});

  useEffect(() => {
    console.log("Updating form with new properties:", nodeProperties);
    setFormData(nodeProperties || {});
  }, [nodeProperties]);

  // Handle changes in form fields
  const handleChange = (event, key) => {
    setFormData({ ...formData, [key]: event.target.value });
  };

  const handleBooleanChange = (event, key) => {
    setFormData({ ...formData, [key]: event.target.checked });
  };

  const handleArrayChange = (event, key, index) => {
    const updatedArray = [...formData[key]];
    updatedArray[index] = event.target.value;
    setFormData({ ...formData, [key]: updatedArray });
  };

  const handlePointChange = (event, key, axis) => {
    const updatedPoint = { ...formData[key], [axis]: parseFloat(event.target.value) };
    setFormData({ ...formData, [key]: updatedPoint });
  };

  const handleDateChange = (date, key) => {
    setFormData({ ...formData, [key]: date });
  };

  const handleSubmit = () => {
    onSubmit(formData);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {Object.keys(formData).map((key) => {
          const value = formData[key];
          const hasSelections = selections && selections[key];

          if (hasSelections) {
            return (
              <FormControl key={key} fullWidth>
                <InputLabel>{key}</InputLabel>
                <Select value={value || ''} onChange={(event) => handleChange(event, key)}>
                  {selections[key].map((selection) => (
                    <MenuItem key={selection} value={selection}>{selection}</MenuItem>
                  ))}
                  <MenuItem value="Other"><em>Other</em></MenuItem>
                </Select>
              </FormControl>
            );
          } else if (typeof value === 'boolean') {
            // Handle Boolean values
            return (
              <FormControlLabel
                key={key}
                control={<Switch checked={value} onChange={(event) => handleBooleanChange(event, key)} />}
                label={key}
              />
            );
          } else if (Array.isArray(value)) {
            // Handle Array types (e.g., location array)
            return (
              <Box key={key} sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <InputLabel>{key}</InputLabel>
                {value.map((item, index) => (
                  <Box key={`${key}-${index}`} sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                      label={`${key}[${index}].x`}
                      value={item.x || ''}
                      onChange={(event) => handlePointChange(event, `${key}[${index}]`, 'x')}
                    />
                    <TextField
                      label={`${key}[${index}].y`}
                      value={item.y || ''}
                      onChange={(event) => handlePointChange(event, `${key}[${index}]`, 'y')}
                    />
                    {/* Check if srid exists and render it correctly */}
                    {item.srid && (
                      <div>{`SRID: ${item.srid.low}`}</div>
                    )}
                  </Box>
                ))}
              </Box>
            );
          } else if (value && typeof value === 'object' && value.hasOwnProperty('x') && value.hasOwnProperty('y')) {
            // Handle Point (x, y) types
            return (
              <Box key={key} sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label={`${key} (x)`}
                  value={value.x || ''}
                  onChange={(event) => handlePointChange(event, key, 'x')}
                />
                <TextField
                  label={`${key} (y)`}
                  value={value.y || ''}
                  onChange={(event) => handlePointChange(event, key, 'y')}
                />
                {/* Check if srid exists and render it correctly */}
                {value.srid && (
                  <div>{`SRID: ${value.srid.low}`}</div>
                )}
              </Box>
            );
          } else if (value instanceof Date) {
            // Handle Date values
            return (
              <DatePicker
                key={key}
                label={key}
                value={value}
                onChange={(date) => handleDateChange(date, key)}
                renderInput={(params) => <TextField {...params} />}
              />
            );
          } else {
            // Default text field for other types
            return (
              <TextField
                key={key}
                label={key}
                value={value || ''}
                onChange={(event) => handleChange(event, key)}
              />
            );
          }
        })}
        <Button variant="contained" onClick={handleSubmit}>Save</Button>
      </Box>
    </LocalizationProvider>
  );
};

export default JsonForm;
