// Bhadke family data — edit names and add new people here.
// Every person: { id, name, spouse?, children? }
// Adding "spouse" shows the partner's card next to the person.
window.FAMILY = {
  id: 'menga', name: 'Menga Bhadke',
  children: [{
    id: 'narayan', name: 'Narayan Bhadke',
    children: [
      {
        id: 'gondu', name: 'Gondu Narayan Bhadke', spouse: 'Raibai Gondu Bhadke',
        children: [
          {
            id: 'vimal', name: 'Vimal',
            children: [
              { id: 'sachin', name: 'Sachin' },
              { id: 'roja', name: 'Roja' }
            ]
          },
          {
            id: 'zituzi', name: 'Zituzi',
            children: [
              { id: 'dipak', name: 'Dipak Bhadke', spouse: 'Lata Bhadke', children: [{ id: 'samyak', name: 'Samyak Bhadke' }] },
              { id: 'devindra', name: 'Devendra Patil', spouse: 'Sagar Patil', children: [{ id: 'sameer', name: 'Sameer Patil' }] }
            ]
          },
          {
            id: 'khuja', name: 'Khuja',
            children: [
              { id: 'anil', name: 'Anil', children: [{ id: 'pankaj', name: 'Pankaj' }] },
              { id: 'latabai', name: 'Latabai Gedam' }
            ]
          }
        ]
      },
      {
        id: 'mulka', name: 'Mulka Narayan Bhadke',
        children: [
          { id: 'jagannath', name: 'Jagannath' },
          { id: 'vaman', name: 'Vaman' }
        ]
      },
      {
        id: 'tulza', name: 'Tulza Narayan Bhadke',
        children: [
          { id: 'ganpat', name: 'Ganpat' },
          { id: 'rajaram', name: 'Rajaram' },
          { id: 'shalik', name: 'Shalik' }
        ]
      },
      {
        id: 'phatta', name: 'Phatta Narayan Bhadke',
        children: [
          { id: 'vashisht', name: 'Vashisht' },
          { id: 'pramod', name: 'Pramod' },
          { id: 'kishor', name: 'Kishor' },
          { id: 'sanju', name: 'Sanju' },
          { id: 'pradnya', name: 'Pradnya' }
        ]
      }
    ]
  }]
};
