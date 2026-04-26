import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

const SPENDING = [
  { label: 'Khana (Food)',   labelHin: 'खाना',     value: 35, color: '#FF6B00' },
  { label: 'Travel',          labelHin: 'यात्रा',    value: 20, color: '#1D9E75' },
  { label: 'EMI',            labelHin: 'EMI',         value: 15, color: '#534AB7' },
  { label: 'Savings',        labelHin: 'बचत',        value: 22, color: '#00D4AA' },
  { label: 'Others',         labelHin: 'अन्य',        value: 8,  color: 'rgba(255,255,255,0.25)' },
];

export default function SpendingDonut() {
  const total = SPENDING.reduce((s, d) => s + d.value, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.40, duration: 0.4, ease: 'easeOut' }}
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '16px',
        padding: '20px',
      }}
    >
      <h3 style={{ color: '#fff', fontSize: '15px', fontWeight: 700, margin: '0 0 2px' }}>Spending Overview</h3>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: '0 0 16px' }}>खर्च विवरण · This month</p>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        {/* Donut */}
        <div style={{ width: '120px', height: '120px', flexShrink: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={SPENDING}
                cx="50%"
                cy="50%"
                innerRadius={36}
                outerRadius={54}
                paddingAngle={3}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
              >
                {SPENDING.map((entry, i) => (
                  <Cell key={i} fill={entry.color} strokeWidth={0} />
                ))}
              </Pie>
              <Tooltip
                formatter={(val) => [`${val}%`, '']}
                contentStyle={{
                  background: '#0F2E2B',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '12px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div style={{ flex: 1, minWidth: '120px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {SPENDING.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.48 + i * 0.06, duration: 0.3 }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                <div>
                  <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px', fontWeight: 500 }}>{item.label}</div>
                  <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px' }}>{item.labelHin}</div>
                </div>
              </div>
              <span style={{ color: '#fff', fontSize: '13px', fontWeight: 700 }}>{item.value}%</span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}