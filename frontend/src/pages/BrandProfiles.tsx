import React, { useState } from 'react';
import { Brand, BrandAsset } from '../types';
import { api } from '../services/api';
import { Modal } from '../components/common/Modal';
import { 
  Building2, 
  Plus, 
  Globe2, 
  Share2, 
  Smartphone, 
  Tag, 
  Trash2, 
  ShieldCheck, 
  ExternalLink,
  Mail,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface BrandProfilesProps {
  brands: Brand[];
  onBrandUpdated: () => void;
}

export const BrandProfiles: React.FC<BrandProfilesProps> = ({ brands, onBrandUpdated }) => {
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(brands[0] || null);

  // Modal: Register Brand
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [newOrgName, setNewOrgName] = useState('');
  const [newIndustry, setNewIndustry] = useState('Banking & Financial Services');
  const [newDomain, setNewDomain] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newAliases, setNewAliases] = useState('');
  const [newLogoUrl, setNewLogoUrl] = useState('');
  const [isSubmittingBrand, setIsSubmittingBrand] = useState(false);
  const [brandError, setBrandError] = useState('');

  // Modal: Add Asset
  const [isAddAssetOpen, setIsAddAssetOpen] = useState(false);
  const [assetType, setAssetType] = useState<'DOMAIN' | 'SOCIAL_HANDLE' | 'MOBILE_APP' | 'TRADEMARK'>('DOMAIN');
  const [assetPlatform, setAssetPlatform] = useState('WEB');
  const [assetValue, setAssetValue] = useState('');
  const [assetNotes, setAssetNotes] = useState('');
  const [isSubmittingAsset, setIsSubmittingAsset] = useState(false);
  const [assetError, setAssetError] = useState('');

  const handleRegisterBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    setBrandError('');
    setIsSubmittingBrand(true);
    try {
      await api.createBrand({
        name: newBrandName,
        organization_name: newOrgName,
        industry: newIndustry,
        primary_domain: newDomain,
        contact_email: newEmail,
        trademark_names: newAliases || undefined,
        logo_url: newLogoUrl || undefined
      });
      setIsRegisterOpen(false);
      onBrandUpdated();
      // Reset form
      setNewBrandName('');
      setNewOrgName('');
      setNewDomain('');
      setNewEmail('');
    } catch (err: any) {
      setBrandError(err.message || 'Failed to register brand.');
    } finally {
      setIsSubmittingBrand(false);
    }
  };

  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBrand) return;
    setAssetError('');
    setIsSubmittingAsset(true);
    try {
      await api.addBrandAsset(selectedBrand.id, {
        asset_type: assetType,
        platform: assetPlatform,
        value: assetValue,
        notes: assetNotes || undefined,
        is_verified: true
      });
      setIsAddAssetOpen(false);
      onBrandUpdated();
      setAssetValue('');
      setAssetNotes('');
    } catch (err: any) {
      setAssetError(err.message || 'Failed to add asset.');
    } finally {
      setIsSubmittingAsset(false);
    }
  };

  const handleDeleteAsset = async (assetId: number) => {
    if (!selectedBrand) return;
    if (!confirm('Remove this official asset from brand registry?')) return;
    try {
      await api.deleteBrandAsset(selectedBrand.id, assetId);
      onBrandUpdated();
    } catch (err: any) {
      alert(err.message || 'Failed to delete asset.');
    }
  };

  const handleDeleteBrand = async (brandId: number) => {
    if (!confirm('Delete brand profile and all associated data?')) return;
    try {
      await api.deleteBrand(brandId);
      onBrandUpdated();
    } catch (err: any) {
      alert(err.message || 'Failed to delete brand.');
    }
  };

  // Keep selectedBrand synchronized with updated brands list
  const currentActive = brands.find(b => b.id === selectedBrand?.id) || brands[0] || null;

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight">Protected Brand Registries</h2>
          <p className="text-xs text-slate-400">
            Define official ground-truth assets used by the multi-agent detection pipeline
          </p>
        </div>
        <button
          onClick={() => setIsRegisterOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-shield-orange hover:bg-shield-orange/90 text-white text-xs font-semibold shadow-glow-orange transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Brand</span>
        </button>
      </div>

      {/* Brand Profile Selector Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {brands.map((b) => {
          const isSelected = currentActive?.id === b.id;
          return (
            <div
              key={b.id}
              onClick={() => setSelectedBrand(b)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                isSelected
                  ? 'border-shield-cyan bg-navy-850/90 shadow-glow-cyan/20'
                  : 'border-slate-800 bg-navy-900/80 hover:border-slate-700 hover:bg-navy-850/50'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-navy-950 border border-slate-800 overflow-hidden flex items-center justify-center shrink-0">
                  {b.logo_url ? (
                    <img src={b.logo_url} alt={b.name} className="w-full h-full object-cover" />
                  ) : (
                    <Building2 className="w-5 h-5 text-shield-cyan" />
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white tracking-tight">{b.name}</h4>
                  <p className="text-[11px] text-slate-400 font-mono truncate">{b.primary_domain}</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-800/80 text-slate-400">
                <span>{b.industry}</span>
                <span className="font-mono text-shield-cyan font-bold">
                  {b.assets ? b.assets.length : 0} Assets
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Brand Ground Truth Asset Manager */}
      {currentActive && (
        <div className="rounded-2xl border border-slate-800/80 bg-navy-900/90 p-6 shadow-card space-y-6">
          {/* Brand Details Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-bold text-white tracking-tight">{currentActive.name}</h3>
                <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Active Shielding
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Organization: <span className="text-slate-300 font-medium">{currentActive.organization_name}</span> • 
                Contact: <span className="text-slate-300 font-mono">{currentActive.contact_email}</span>
              </p>
              {currentActive.trademark_names && (
                <p className="text-xs text-slate-400 mt-1">
                  Protected Trademarks / Aliases: <span className="text-shield-cyan font-mono">{currentActive.trademark_names}</span>
                </p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsAddAssetOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-navy-950 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-semibold transition-colors"
              >
                <Plus className="w-4 h-4 text-shield-cyan" />
                <span>Add Official Asset</span>
              </button>
              <button
                onClick={() => handleDeleteBrand(currentActive.id)}
                className="p-2 rounded-xl border border-slate-800 bg-navy-950 text-slate-400 hover:text-red-400 hover:border-red-500/30 transition-colors"
                title="Delete Brand Registry"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Official Registered Assets List */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-white">Verified Official Assets (Ground Truth)</h4>
              <span className="text-xs text-slate-400">
                Items matching these entries bypass risk scoring as authorized brand properties
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-navy-950 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Asset Type</th>
                    <th className="py-3 px-4">Platform</th>
                    <th className="py-3 px-4">Identifier / Value</th>
                    <th className="py-3 px-4">Verification</th>
                    <th className="py-3 px-4">Notes</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 font-normal">
                  {(currentActive.assets || []).map((asset) => (
                    <tr key={asset.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-shield-cyan flex items-center gap-1.5">
                        {asset.asset_type === 'DOMAIN' && <Globe2 className="w-3.5 h-3.5" />}
                        {asset.asset_type === 'SOCIAL_HANDLE' && <Share2 className="w-3.5 h-3.5" />}
                        {asset.asset_type === 'MOBILE_APP' && <Smartphone className="w-3.5 h-3.5" />}
                        {asset.asset_type === 'TRADEMARK' && <Tag className="w-3.5 h-3.5" />}
                        <span>{asset.asset_type}</span>
                      </td>
                      <td className="py-3 px-4 font-medium text-white">{asset.platform}</td>
                      <td className="py-3 px-4 font-mono text-slate-200 select-all font-semibold">
                        {asset.value}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          <CheckCircle className="w-3 h-3" />
                          Verified
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 max-w-xs truncate">{asset.notes || '—'}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDeleteAsset(asset.id)}
                          className="p-1 rounded text-slate-400 hover:text-red-400 transition-colors"
                          title="Delete asset"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {(!currentActive.assets || currentActive.assets.length === 0) && (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-400 text-xs">
                        No official assets registered yet. Click "Add Official Asset" above.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REGISTER NEW BRAND */}
      <Modal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        title="Register Organization & Protected Brand"
        subtitle="Establish verified baseline for digital asset defense"
        maxWidth="lg"
      >
        <form onSubmit={handleRegisterBrand} className="space-y-4">
          {brandError && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>{brandError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Brand Name *</label>
              <input
                type="text"
                placeholder="e.g. Apex Global Bank"
                value={newBrandName}
                onChange={(e) => setNewBrandName(e.target.value)}
                className="w-full bg-navy-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-shield-orange"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Legal Entity / Organization *</label>
              <input
                type="text"
                placeholder="e.g. Apex Financial Group Inc."
                value={newOrgName}
                onChange={(e) => setNewOrgName(e.target.value)}
                className="w-full bg-navy-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-shield-orange"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Industry Sector</label>
              <input
                type="text"
                placeholder="e.g. Banking & Financial Services"
                value={newIndustry}
                onChange={(e) => setNewIndustry(e.target.value)}
                className="w-full bg-navy-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-shield-orange"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Primary Domain *</label>
              <input
                type="text"
                placeholder="e.g. apexbank.com"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                className="w-full bg-navy-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-shield-orange font-mono"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Security / Abuse Email *</label>
              <input
                type="email"
                placeholder="security@apexbank.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full bg-navy-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-shield-orange font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Logo URL (optional)</label>
              <input
                type="url"
                placeholder="https://..."
                value={newLogoUrl}
                onChange={(e) => setNewLogoUrl(e.target.value)}
                className="w-full bg-navy-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-shield-orange"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Trademark Names & Aliases (comma-separated)</label>
            <input
              type="text"
              placeholder="e.g. Apex Bank, Apex Financial, ApexPay"
              value={newAliases}
              onChange={(e) => setNewAliases(e.target.value)}
              className="w-full bg-navy-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-shield-orange"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsRegisterOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-800 hover:bg-slate-800 text-xs text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingBrand}
              className="px-5 py-2 rounded-xl bg-shield-orange hover:bg-shield-orange/90 text-white text-xs font-semibold shadow-glow-orange disabled:opacity-50"
            >
              {isSubmittingBrand ? 'Registering...' : 'Complete Brand Registration'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: ADD BRAND ASSET */}
      <Modal
        isOpen={isAddAssetOpen}
        onClose={() => setIsAddAssetOpen(false)}
        title={`Add Official Asset • ${currentActive?.name}`}
        subtitle="Register verified domains, handles, and mobile apps"
        maxWidth="md"
      >
        <form onSubmit={handleAddAsset} className="space-y-4">
          {assetError && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>{assetError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Asset Category</label>
            <select
              value={assetType}
              onChange={(e) => setAssetType(e.target.value as any)}
              className="w-full bg-navy-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-shield-cyan"
            >
              <option value="DOMAIN">DOMAIN (Website, sub-domain, portal)</option>
              <option value="SOCIAL_HANDLE">SOCIAL_HANDLE (Twitter, LinkedIn, Instagram)</option>
              <option value="MOBILE_APP">MOBILE_APP (Package name or App Store ID)</option>
              <option value="TRADEMARK">TRADEMARK (Registered slogan or mark)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Platform</label>
              <input
                type="text"
                placeholder="e.g. WEB, TWITTER, GOOGLE_PLAY"
                value={assetPlatform}
                onChange={(e) => setAssetPlatform(e.target.value)}
                className="w-full bg-navy-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-shield-cyan font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Asset Identifier *</label>
              <input
                type="text"
                placeholder="e.g. @apexbank or com.apex.app"
                value={assetValue}
                onChange={(e) => setAssetValue(e.target.value)}
                className="w-full bg-navy-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-shield-cyan font-mono"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Verification Notes</label>
            <input
              type="text"
              placeholder="e.g. Official Play Store production app verified with corporate key"
              value={assetNotes}
              onChange={(e) => setAssetNotes(e.target.value)}
              className="w-full bg-navy-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-shield-cyan"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsAddAssetOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-800 hover:bg-slate-800 text-xs text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingAsset}
              className="px-5 py-2 rounded-xl bg-shield-cyan/20 border border-shield-cyan/40 hover:bg-shield-cyan/30 text-shield-cyan text-xs font-semibold disabled:opacity-50"
            >
              {isSubmittingAsset ? 'Saving...' : 'Add Verified Asset'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
