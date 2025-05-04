import React from 'react';
import {
  Box, Typography, Tabs, Tab, Paper, Grid, Divider, Button
} from '@mui/material';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import { saveAs } from 'file-saver';
import Papa from 'papaparse';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export const Reports = () => {
  const [tabIndex, setTabIndex] = React.useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };

  const incomeData = [
    { month: 'Jan', amount: 1000 },
    { month: 'Feb', amount: 1200 },
    { month: 'Mar', amount: 900 },
    { month: 'Apr', amount: 1450 },
    { month: 'Mai', amount: 1300 },
  ];

  const memberGrowth = [
    { month: 'Jan', members: 30 },
    { month: 'Feb', members: 32 },
    { month: 'Mar', members: 35 },
    { month: 'Apr', members: 38 },
    { month: 'Mai', members: 41 },
  ];

  const voteStats = [
    { name: 'Zugestimmt', value: 85 },
    { name: 'Abgelehnt', value: 15 },
  ];

  const handleExportCSV = () => {
    const csv = Papa.unparse(incomeData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    saveAs(blob, "finanzen.csv");
  };

  return (
      <Box p={4}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Berichte & Statistiken
        </Typography>

        <Paper sx={{ mb: 3 }}>
          <Tabs value={tabIndex} onChange={handleChange} indicatorColor="primary" textColor="primary" centered>
            <Tab label="Finanzen" />
            <Tab label="Mitglieder" />
            <Tab label="Abstimmungen" />
          </Tabs>
        </Paper>

        {tabIndex === 0 && (
            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6">Einnahmen pro Monat</Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={incomeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="amount" stroke="#8884d8" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6">Zahlungsüberblick</Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={incomeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="amount" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </Grid>
            </Grid>
        )}

        {tabIndex === 1 && (
            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6">Mitgliederentwicklung</Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={memberGrowth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="members" stroke="#8884d8" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6">Rollenverteilung (Demo)</Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={[{name: 'Admins', value: 10}, {name: 'Mitglieder', value: 30}]} dataKey="value" outerRadius={100} label>
                      {COLORS.map((color, index) => (
                          <Cell key={index} fill={color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </Grid>
            </Grid>
        )}

        {tabIndex === 2 && (
            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6">Letzte Abstimmung</Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={voteStats} dataKey="value" outerRadius={100} label>
                      {voteStats.map((entry, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6">Beteiligung über Zeit</Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={[
                    {month: 'Feb', value: 40},
                    {month: 'Mär', value: 60},
                    {month: 'Apr', value: 72},
                    {month: 'Mai', value: 85},
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#ff7300" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </Grid>
            </Grid>
        )}

        <Divider sx={{ my: 4 }} />
        <Box display="flex" justifyContent="flex-end" gap={2}>
          <Button variant="outlined" onClick={handleExportCSV}>Exportieren (CSV)</Button>
          <Button variant="outlined">Exportieren (PDF)</Button>
        </Box>
      </Box>
  );
};
