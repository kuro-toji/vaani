import express from 'express';

const ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'vaani-admin-secret-change-me';

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

    // Sanitize lead name
    const sanitizedName = String(lead.name || '').replace(/[<>\"\'&]/g, '').substring(0, 100);
    const cleanLead = { ...lead, name: sanitizedName };

    // Deduplicate by phone + category (keep most recent)
    const existingIndex = leads.findIndex(l => 
      l.phone === cleanLead.phone && l.productCategory === cleanLead.productCategory
    );
    
    if (existingIndex >= 0) {
      leads[existingIndex] = { ...leads[existingIndex], ...cleanLead, updatedAt: new Date().toISOString() };
    } else {
      leads.push({ ...cleanLead, receivedAt: new Date().toISOString() });
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
  if (req.headers['x-admin-key'] !== ADMIN_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

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
