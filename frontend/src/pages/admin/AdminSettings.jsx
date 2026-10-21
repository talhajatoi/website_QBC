import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../Components/LoadingSpinner';
import { useAuth } from '../../hooks/useAuth';
import { useBusiness } from '../../hooks/useBusiness';

const emptyBusiness = {
  storeName: '',
  whatsappNumber: '',
  contactPhone: '',
  contactEmail: '',
  address: '',
  socialLinks: { facebook: '', instagram: '', tiktok: '', youtube: '' },
};

export default function AdminSettings() {
  const { admin, changePassword, updateProfile } = useAuth();
  const { business, loading, error: businessError, saveBusiness } = useBusiness();
  const { reset: resetBusiness, ...businessForm } = useForm({ defaultValues: emptyBusiness });
  const { reset: resetProfile, ...profileForm } = useForm({ defaultValues: { name: '', email: '', currentPassword: '' } });
  const passwordForm = useForm({ defaultValues: { currentPassword: '', newPassword: '' } });
  const [error, setError] = useState('');

  useEffect(() => {
    if (business) resetBusiness(business);
  }, [business, resetBusiness]);

  useEffect(() => {
    if (admin) resetProfile({ name: admin.name, email: admin.email, currentPassword: '' });
  }, [admin, resetProfile]);

  const submitBusiness = async (values) => {
    try {
      setError('');
      await saveBusiness(values);
      toast.success('Store details updated.');
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const submitProfile = async (values) => {
    try {
      setError('');
      await updateProfile(values);
      toast.success('Administrator account details updated.');
      profileForm.setValue('currentPassword', '');
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const submitPassword = async (values) => {
    try {
      setError('');
      await changePassword(values);
      toast.success('Password changed. Sign in again to receive a new token.');
      passwordForm.reset();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <>
      <p className="eyebrow">Account and store</p>
      <h1 className="section-title">Settings</h1>
      {error && <p role="alert" className="mt-5 max-w-3xl rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {businessError && <p role="alert" className="mt-5 max-w-3xl rounded-xl bg-red-50 p-3 text-sm text-red-700">Could not load store details: {businessError.message}</p>}

      <form onSubmit={businessForm.handleSubmit(submitBusiness)} className="mt-8 max-w-3xl rounded-3xl bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-xl font-black">Public store details</h2>
        <p className="mt-2 text-sm text-zinc-600">These details appear on the customer-facing website and the WhatsApp order message.</p>
        {loading ? <LoadingSpinner label="Loading store details" /> : (
          <>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="field sm:col-span-2">Store name<input className="input" maxLength="120" {...businessForm.register('storeName', { required: 'Store name is required' })} /></label>
              <label className="field">WhatsApp number<input className="input" placeholder="92XXXXXXXXXX or 03XXXXXXXXX" {...businessForm.register('whatsappNumber', { required: 'WhatsApp number is required' })} /><small>Enter the full international number or a Pakistani mobile number beginning with 03; it will be saved in international format.</small></label>
              <label className="field">Contact phone<input className="input" maxLength="40" {...businessForm.register('contactPhone')} /></label>
              <label className="field">Contact email<input className="input" type="email" maxLength="254" {...businessForm.register('contactEmail')} /></label>
              <label className="field sm:col-span-2">Store address<textarea className="input min-h-24" maxLength="500" {...businessForm.register('address')} /></label>
            </div>
            <fieldset className="mt-6 rounded-2xl border border-zinc-200 p-4">
              <legend className="px-2 text-sm font-bold">Social media links</legend>
              <div className="grid gap-4 sm:grid-cols-2">
                {['facebook', 'instagram', 'tiktok', 'youtube'].map((network) => (
                  <label className="field capitalize" key={network}>{network}<input className="input" type="url" placeholder="https://" {...businessForm.register(`socialLinks.${network}`)} /></label>
                ))}
              </div>
            </fieldset>
            <button disabled={businessForm.formState.isSubmitting} className="btn-primary mt-6">
              {businessForm.formState.isSubmitting ? 'Saving…' : 'Save store details'}
            </button>
          </>
        )}
      </form>

      <form onSubmit={profileForm.handleSubmit(submitProfile)} className="mt-6 max-w-3xl rounded-3xl bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-xl font-black">Administrator contact</h2>
        <p className="mt-2 text-sm text-zinc-600">Private sign-in account information; these fields are not shown as public store contact details.</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="field">Name<input className="input" maxLength="100" {...profileForm.register('name', { required: true })} /></label>
          <label className="field">Email<input className="input" type="email" maxLength="254" {...profileForm.register('email', { required: true })} /></label>
          <label className="field sm:col-span-2">Current password to confirm change<input className="input" type="password" autoComplete="current-password" {...profileForm.register('currentPassword', { required: true })} /></label>
        </div>
        <button disabled={profileForm.formState.isSubmitting} className="btn-primary mt-5">Save administrator contact</button>
      </form>

      <form onSubmit={passwordForm.handleSubmit(submitPassword)} className="mt-6 max-w-3xl rounded-3xl bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-xl font-black">Change password</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="field">Current password<input type="password" autoComplete="current-password" className="input" {...passwordForm.register('currentPassword', { required: true })} /></label>
          <label className="field">New password<input type="password" autoComplete="new-password" className="input" {...passwordForm.register('newPassword', { required: true, minLength: 12 })} /></label>
        </div>
        <p className="mt-3 text-xs text-zinc-500">Use at least 12 characters, including lowercase, uppercase, and a number.</p>
        <button disabled={passwordForm.formState.isSubmitting} className="btn-primary mt-5">Change password</button>
      </form>
    </>
  );
}
