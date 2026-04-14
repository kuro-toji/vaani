import express from 'express';

const router = express.Router();

// In-memory store for demo (replace with DB in production)
const leads = [];

/**
 * POST /api/leads — Save a new lead
 */
router.post('/', (req, res) => {
  try {
    const lead = req.body;
    
    if (!lead.pincode || !lead.productCategory) {
      return res.status(400).json({ error: 'pincode and productCategory are required' });
    }

    // Basic validation
    if (lead.phone && !/^[6-9]\d{9}$/.test(lead.phone)) {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }

    // Deduplicate by phone + category (keep most recent)
    const existingIndex = leads.findIndex(l => 
      l.phone === lead.phone && l.productCategory === lead.productCategory
    );
    
    if (existingIndex >= 0) {
      leads[existingIndex] = { ...leads[existingIndex], ...lead, updatedAt: new Date().toISOString() };
    } else {
      leads.push({ ...lead, receivedAt: new Date().toISOString() });
    }

    console.log(`[LEAD] New lead: ${lead.productCategory} | ${lead.language} | phone: ${lead.phone || 'N/A'} | pincode: ${lead.pincode}`);

    res.json({ success: true, leadId: lead.id, message: 'Lead saved successfully' });
  } catch (error) {
    console.error('Lead save error:', error);
    res.status(500).json({ error: 'Failed to save lead' });
  }
});

/**
 * GET /api/leads — Get all leads (for admin/dashboard)
 */
router.get('/', (req, res) => {
  const { category, limit = 100, offset = 0 } = req.query;
  
  let filtered = leads;
  if (category) {
    filtered = leads.filter(l => l.productCategory === category);
  }
  
  const paginated = filtered.slice(Number(offset), Number(offset) + Number(limit));
  
  res.json({
    total: filtered.length,
    leads: paginated,
    stats: {
      total: leads.length,
      contactable: leads.filter(l => l.status === 'contactable').length,
      byCategory: leads.reduce((acc, l) => {
        acc[l.productCategory] = (acc[l.productCategory] || 0) + 1;
        return acc;
      }, {}),
    },
  });
});

export default router;
