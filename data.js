// Bhadke family data — yahan se naam badal sakte ho, naye log add kar sakte ho.
// Har person: { id, name, spouse?, children? }
// "spouse" likhne par person ke saath jeevansathi ka card dikhega.
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
              { id: 'dipak', name: 'Dipak', children: [{ id: 'samyak', name: 'Samyak Bhadke' }] },
              { id: 'devindra', name: 'Devindra', children: [{ id: 'sameer', name: 'Sameer Patil' }] }
            ]
          },
          {
            id: 'khuja', name: 'Khuja',
            children: [
              { id: 'anil', name: 'Anil', children: [{ id: 'pankaj', name: 'Pankaj' }] },
              { id: 'latabai', name: 'Latabai', spouse: 'Gedam' }
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
