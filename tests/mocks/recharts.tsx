import * as Recharts from 'recharts';
import { ReactElement } from 'react';

const MockResponsiveContainer = ({ children, width = 800, height = 300 }: any) => {
  return (
    <div style={{ width, height }}>
      {typeof children === 'function' ? children({ width, height }) : children}
    </div>
  );
};

module.exports = {
  ...Recharts,
  ResponsiveContainer: MockResponsiveContainer,
};
