import Sheet from '../components/Sheet.jsx';
import { Label } from '../components/Primitives.jsx';
import { useApp } from '../store/AppProvider.jsx';
import { CATEGORIES, categoryLabel } from '../data/money.js';
import { MNY, dim } from '../lib/theme.js';

const FILTERS = ['Todo', ...CATEGORIES];

export default function TransactionFilterSheet() {
  const { state, dispatch } = useApp();

  return (
    <Sheet title="Filter transactions" onClose={() => dispatch({ type: 'closeTxnFilters' })} maxHeight="78%">
      <div className="scroll" style={{ flex: 1, paddingTop: 10 }}>
        <Label style={{ marginBottom: 8 }}>SHOW THIS MONTH</Label>
        <div role="group" aria-label="Transaction category">
          {FILTERS.map((filter) => {
            const selected = state.txnFilter === filter;
            return (
              <button
                key={filter}
                aria-pressed={selected}
                onClick={() => dispatch({ type: 'selectTxnFilter', filter })}
                style={{
                  width: '100%',
                  minHeight: 48,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 16,
                  padding: '10px 2px',
                  borderBottom: `1px solid ${dim(0.1)}`,
                  fontSize: 16,
                }}
              >
                <span>{filter === 'Todo' ? 'All transactions' : categoryLabel(filter)}</span>
                <span
                  aria-hidden="true"
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 6,
                    border: `1px solid ${selected ? MNY : dim(0.28)}`,
                    background: selected ? MNY : 'transparent',
                    boxShadow: selected ? 'inset 0 0 0 4px #141412' : 'none',
                    flexShrink: 0,
                  }}
                />
              </button>
            );
          })}
        </div>
      </div>
    </Sheet>
  );
}
