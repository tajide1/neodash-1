import React, { useState, useEffect } from 'react';
import { Box, Button, Modal, Typography, Grid, Snackbar, Alert } from '@mui/material';
import JsonDataGrid from './JsonDataGrid'; // Table component for displaying data
import JsonForm from './JsonForm'; // Form component for editing data
import { ChartProps } from '../../chart/Chart'; // Assuming this contains records and queryCallback

enum FormStatus {
  DATA_ENTRY = 0,
  RUNNING = 1,
  SUBMITTED = 2,
  ERROR = 3,
}

const EditReport = (props: ChartProps) => {
  const extractedData = props.records.map((record) => record._fields[0].properties);
  const [selectedNode, setSelectedNode] = useState(null);
  const [records, setRecords] = useState(extractedData);
  const [status, setStatus] = useState<FormStatus>(FormStatus.DATA_ENTRY);
  const [isModalOpen, setModalOpen] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false); // Snackbar for feedback
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  const [selections, setSelections] = useState(null); // State for selections

  // Handle row click, store the selected node properties
  const handleRowClick = (nodeProperties) => {
    console.log("Row clicked:", nodeProperties); // Log selected node properties for debugging
    setSelectedNode({ ...nodeProperties }); // Store node properties for editing
  };

   // Effect to track updates in selections
   useEffect(() => {
    console.log("Selections updated:", selections); // Log the updated selections
    // You can add additional logic here to handle selection changes if needed
  }, [selections]); // Runs when selections prop changes



  // Fetch selections when selectedNode changes
  useEffect(() => {
    if (selectedNode) {
      const fetchSelections = async (nodeId) => {
        const query = `
          MATCH (n)
          WHERE id(n) = $id
          WITH labels(n) AS nodeLabels
          CALL apoc.cypher.run(
            'MATCH (m:' + apoc.text.join(nodeLabels, ":") + ')
            WITH m, keys(m) AS propertyKeys
            UNWIND propertyKeys AS key
            WITH key, collect(DISTINCT m[key]) AS values
            RETURN apoc.map.fromPairs(collect([key, values])) AS aggregatedProperties',
            {}
          ) YIELD value
          RETURN value.aggregatedProperties
        `;
        const parameters = {
          id: nodeId,
        };

        try {
          const result = await new Promise((resolve, reject) => {
            props.queryCallback(query, parameters, (result) => {
              if (result && result[0] && result[0].error) {
                reject(result[0].error);
              }
              resolve(result);
            });
          });
          console.log("Selections", result)
          setSelections(result[0]._fields[0]);
        } catch (error) {
          console.error('Failed to fetch selections:', error);
          setSelections(null); // Reset selections on error
        }
      };

      // Fetch selections for the currently selected node
      fetchSelections(props.records[selectedNode.id]._fields[0].identity.low);
    }
  }, [selectedNode, props.records, props.queryCallback]); // Runs when selectedNode changes

  const handleFormSubmit = (updatedData) => {
    console.log("Form submitted with data:", updatedData); // Log form submission data
    setSelectedNode({ ...updatedData }); // Preserve the index while updating the selectedNode
    setModalOpen(true); // Open confirmation modal for submission
  };

  const confirmSubmit = async () => {
    setStatus(FormStatus.RUNNING); // Set form status to running

    // Use the index stored in selectedNode to get the correct record and identity
    const identity = props.records[selectedNode.id]._fields[0].identity.low;

    const query = `
      MATCH (n)
      WHERE id(n) = $id
      SET n += $properties
      RETURN n
    `;
    const parameters = {
      id: identity,
      properties: selectedNode,
    };

    try {
      // Use props.queryCallback to send the updated data to Neo4j
      await new Promise((resolve, reject) => {
        props.queryCallback(query, parameters, (result) => {
          if (result && result[0] && result[0].error) {
            reject(result[0].error);
          }
          resolve(result);
        });
      });
      setStatus(FormStatus.SUBMITTED); // Update the status after successful submission
      setSnackbarMessage('Data successfully updated!');
      setSnackbarSeverity('success');
    } catch (error) {
      console.error('Failed to submit data to Neo4j:', error);
      setStatus(FormStatus.ERROR); // Handle any errors during submission
      setSnackbarMessage('Failed to update data.');
      setSnackbarSeverity('error');
    } finally {
      setModalOpen(false); // Close the modal after submission
      setOpenSnackbar(true); // Show feedback
    }
  };

  return (
    <Box sx={{ padding: 2 }}>
      <Grid container spacing={4}>
        {/* DataGrid Table */}
        <Grid item xs={12} md={6}>
          <Typography variant="h6" gutterBottom>
            Select a Node to Edit
          </Typography>
          <JsonDataGrid jsonData={records} onRowClick={handleRowClick} />
        </Grid>

        {/* Form for Editing */}
        <Grid item xs={12} md={6}>
          {selectedNode ? (
            <>
              <Typography variant="h6" gutterBottom>
                Edit Node Properties
              </Typography>
              <JsonForm nodeProperties={selectedNode} selections={selections} onSubmit={handleFormSubmit} />
            </>
          ) : (
            <Typography variant="body1">Select a row to edit properties</Typography>
          )}
        </Grid>
      </Grid>

      {/* Confirmation Modal */}
      <Modal open={isModalOpen} onClose={() => setModalOpen(false)}>
        <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', bgcolor: 'background.paper', p: 4, boxShadow: 24, borderRadius: 1 }}>
          <Typography variant="h6">Confirm Submission</Typography>
          <Typography sx={{ mt: 2 }}>Are you sure you want to submit these changes to Neo4j?</Typography>
          <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
            <Button variant="contained" onClick={confirmSubmit}>
              Yes
            </Button>
            <Button variant="outlined" onClick={() => setModalOpen(false)}>
              No
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* Snackbar for feedback */}
      <Snackbar open={openSnackbar} autoHideDuration={6000} onClose={() => setOpenSnackbar(false)}>
        <Alert onClose={() => setOpenSnackbar(false)} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EditReport;
