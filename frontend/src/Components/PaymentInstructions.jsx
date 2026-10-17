export default function PaymentInstructions({ instructions }) {
  if (Array.isArray(instructions)) {
    return instructions.map((account) => <div className="mt-3 border-t border-yellow-200 pt-3 first:mt-0 first:border-0 first:pt-0" key={account.method}>
      <p className="font-black">{account.method}</p>
      {account.bankName && <p>Bank: {account.bankName}</p>}
      {account.accountTitle && <p>Account title: {account.accountTitle}</p>}
      {account.accountNumber && <p>Account number: {account.accountNumber}</p>}
      {account.iban && <p>IBAN: {account.iban}</p>}
    </div>);
  }

  if (!instructions) return <p>Payment details are not available. Please contact the store.</p>;

  return <>
    <p className="font-black">{instructions.provider || 'Advance payment account'}</p>
    {instructions.accountTitle && <p>Account title: {instructions.accountTitle}</p>}
    {instructions.accountNumber && <p>Account number: {instructions.accountNumber}</p>}
    {instructions.iban && <p>IBAN: {instructions.iban}</p>}
  </>;
}
