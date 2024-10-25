import React, { useState } from 'react'; // Import React and useState hook
import { DataGrid, GridToolbar } from '@mui/x-data-grid'; // Import DataGrid and GridToolbar from Material-UI
import { Box } from '@mui/material'; // Import Box component for layout

const JsonDataGrid = ({ jsonData, onRowClick }) => {
  // State to manage the number of rows per page
  const [pageSize, setPageSize] = useState(5);
  // State to manage the currently selected rows
  const [selectionModel, setSelectionModel] = useState([]);

  // Collect all unique keys from jsonData to generate DataGrid columns dynamically
  const columns = Array.from(
    new Set(jsonData.flatMap((item) => Object.keys(item))) // Flatten the array of keys from each item
  ).map((key) => ({
    field: key, // Field name for the column
    headerName: key.charAt(0).toUpperCase() + key.slice(1), // Capitalize the first letter for the header
    flex: 1, // Allows the column to grow and fill available space
    valueGetter: (params) =>
      typeof params.row[key] === 'object' ? JSON.stringify(params.row[key]) : params.row[key], // Convert nested objects/arrays to JSON string
  }));

  // Ensure each row has an `id` field for the DataGrid by mapping through jsonData
  const rows = jsonData.map((item, index) => ({
    id: index, // Using the index as id if no id field is present
    ...item, // Spread the item properties into the row
  }));

  // Handle changes in the selection model when a row is selected
  const handleSelectionModelChange = (newSelection) => {
    setSelectionModel(newSelection); // Update the selection model state
    if (newSelection.length > 0) {
      // If at least one row is selected
      const selectedRowData = rows.find((row) => row.id === newSelection[0]); // Find the selected row data
      onRowClick(selectedRowData); // Pass the selected row data to the parent component through onRowClick prop
    }
  };

  return (
    <Box sx={{ height: 400, width: '100%' }}> {/* Set height and width for the DataGrid */}
      <DataGrid
        rows={rows} // Pass the rows data to the DataGrid
        columns={columns} // Pass the columns configuration
        pageSize={pageSize} // Set the current page size
        onPageSizeChange={(newPageSize) => setPageSize(newPageSize)} // Handle page size change
        rowsPerPageOptions={[5, 10, 20]} // Options for rows per page
        checkboxSelection // Enable checkbox selection for rows
        disableSelectionOnClick // Disable row selection when clicking on cell
        components={{ Toolbar: GridToolbar }} // Enables search/filter toolbar in the DataGrid
        selectionModel={selectionModel} // Controlled selection model
        onSelectionModelChange={handleSelectionModelChange} // Handle selection model change
      />
    </Box>
  );
};

export default JsonDataGrid; // Export the component for use in other parts of the application
