// Asset Guard — pricing tiers from the content map. Honest framing: design phase.
const tiers = [
  {
    name: 'Free',
    price: '$0',
    features: ['1 asset', 'Basic productivity score'],
    cta: 'Try Free',
  },
  {
    name: 'Growth',
    price: '$TBD',
    features: ['Up to 10 assets', 'Live monitoring', 'Improvement steps'],
    cta: 'Start Growth',
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    features: ['Unlimited assets', 'Custom integrations', 'Dedicated support'],
    cta: 'Contact Us',
  },
];

export default function Pricing() {
  return (
    <section>
      <h2>Pricing</h2>
      <p style={{ fontSize: '0.85rem', color: '#88889c', marginBottom: 16 }}>
        Asset Guard is in design — tiers below are the planned model, not live billing.
      </p>
      <div className="pricing">
        {tiers.map((t) => (
          <div className="tier" key={t.name}>
            <h3>{t.name}</h3>
            <div className="price">{t.price}</div>
            <ul>
              {t.features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            <span className="btn">{t.cta}</span>
          </div>
        ))}
      </div>
    </section>
  );
}