'use client';
// ============================================================
// KycDossierModal — Modal en 3 étapes pour le workflow KYC client
// Étape 1 : Informations document
// Étape 2 : Photos du document (recto / verso)
// Étape 3 : Selfie de vérification
// Vue vérificateur (ADMIN) : photos + boutons Valider / Refuser
// ============================================================
import React, { useState, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, CheckCircle, XCircle, Upload, Eye } from 'lucide-react';
import { KycDossier, useSoumettreDocuments, useValiderDossier, useRefuserDossier } from '@/hooks/useKycDossiers';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface KycDossierModalProps {
  /** Client cible */
  clientId: string;
  clientNom: string;
  /** Dossier existant (null si aucun) */
  dossier: KycDossier | null;
  /** Mode vérificateur (ADMIN) */
  estAdmin?: boolean;
  onClose: () => void;
}

const TYPES_DOCUMENT = [
  { value: 'CNI', label: "Carte Nationale d'Identité (CNI)" },
  { value: 'PASSEPORT', label: 'Passeport' },
  { value: 'PERMIS', label: 'Permis de conduire' },
  { value: 'CARTE_SEJOUR', label: 'Carte de séjour' },
];

const STATUT_BADGE: Record<string, { label: string; cls: string }> = {
  EN_ATTENTE: { label: 'En attente',  cls: 'gm-pill gm-pill-pending' },
  EN_COURS:   { label: 'En cours',    cls: 'gm-pill gm-pill-processing' },
  VALIDE:     { label: 'Validé',      cls: 'gm-pill gm-pill-success' },
  REFUSE:     { label: 'Refusé',      cls: 'gm-pill gm-pill-danger' },
  EXPIRE:     { label: 'Expiré',      cls: 'gm-pill gm-pill-offline' },
};

// ── Utilitaires ────────────────────────────────────────────────────────────────

function lirePhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.size > 3 * 1024 * 1024) {
      reject(new Error('Le fichier ne doit pas dépasser 3 Mo.'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Lecture impossible.'));
    reader.readAsDataURL(file);
  });
}

function erreurApi(err: unknown): string {
  const e = err as { response?: { data?: { message?: unknown } } };
  const m = e?.response?.data?.message;
  if (Array.isArray(m)) return m.join(', ');
  if (typeof m === 'string' && m) return m;
  return 'Une erreur est survenue. Réessayez.';
}

// ── Composant upload photo ─────────────────────────────────────────────────────

function UploadZone({
  label,
  dataUrl,
  onChange,
  obligatoire = false,
}: {
  label: string;
  dataUrl: string | null;
  onChange: (url: string | null) => void;
  obligatoire?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [erreur, setErreur] = useState('');

  const handleFile = async (file: File) => {
    setErreur('');
    try {
      const url = await lirePhoto(file);
      onChange(url);
    } catch (e: unknown) {
      setErreur(e instanceof Error ? e.message : 'Erreur.');
      onChange(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 13 }}>
        {label} {obligatoire && <span style={{ color: 'var(--color-danger)' }}>*</span>}
      </label>
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => ref.current?.click()}
        style={{
          border: '2px dashed var(--color-border)',
          borderRadius: 10,
          padding: 16,
          textAlign: 'center',
          cursor: 'pointer',
          background: dataUrl ? 'var(--color-surface-2)' : 'var(--color-surface)',
          minHeight: 120,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          transition: 'border-color 0.2s',
        }}
      >
        {dataUrl ? (
          <>
            <img
              src={dataUrl}
              alt={label}
              style={{ maxHeight: 140, maxWidth: '100%', borderRadius: 6, objectFit: 'contain' }}
            />
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Cliquez pour changer</span>
          </>
        ) : (
          <>
            <Upload size={28} style={{ color: 'var(--color-text-muted)' }} />
            <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
              Glissez-déposez ou <span style={{ color: 'var(--color-primary)' }}>parcourir</span>
            </span>
            <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>JPG, PNG, WEBP — max 3 Mo</span>
          </>
        )}
        <input
          ref={ref}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style={{ display: 'none' }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
      </div>
      {erreur && <p style={{ color: 'var(--color-danger)', fontSize: 12, marginTop: 4 }}>{erreur}</p>}
    </div>
  );
}

// ── Indicateur d'étape ─────────────────────────────────────────────────────────

function Stepper({ etape, total }: { etape: number; total: number }) {
  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 24 }}>
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          style={{
            width: i === etape ? 28 : 8,
            height: 8,
            borderRadius: 4,
            background: i === etape
              ? 'var(--color-primary)'
              : i < etape
                ? 'var(--color-success)'
                : 'var(--color-border)',
            transition: 'all 0.3s',
          }}
        />
      ))}
    </div>
  );
}

// ── Modal principal ────────────────────────────────────────────────────────────

export function KycDossierModal({
  clientId,
  clientNom,
  dossier,
  estAdmin = false,
  onClose,
}: KycDossierModalProps) {
  // Étapes : 0=infos, 1=photos document, 2=selfie
  const [etape, setEtape] = useState(0);

  // Formulaire étape 1
  const [typeDocument, setTypeDocument] = useState(dossier?.typeDocument ?? '');
  const [numeroDocument, setNumeroDocument] = useState(dossier?.numeroDocument ?? '');
  const [dateExpiration, setDateExpiration] = useState(
    dossier?.dateExpiration ? dossier.dateExpiration.substring(0, 10) : ''
  );
  const [paysEmetteur, setPaysEmetteur] = useState(dossier?.paysEmetteur ?? '');

  // Formulaire étape 2
  const [photoRecto, setPhotoRecto] = useState<string | null>(dossier?.photoRecto ?? null);
  const [photoVerso, setPhotoVerso] = useState<string | null>(dossier?.photoVerso ?? null);

  // Formulaire étape 3
  const [photoSelfie, setPhotoSelfie] = useState<string | null>(dossier?.photoSelfie ?? null);

  // État décision admin
  const [commentaireAdmin, setCommentaireAdmin] = useState('');
  const [afficheRefus, setAfficheRefus] = useState(false);

  // Retour
  const [erreur, setErreur] = useState('');
  const [succes, setSucces] = useState('');

  const soumettre = useSoumettreDocuments();
  const valider = useValiderDossier();
  const refuser = useRefuserDossier();

  const isMutating = soumettre.isPending || valider.isPending || refuser.isPending;

  // ── Navigation étapes ────────────────────────────────────────────────────────

  const validerEtape1 = () => {
    if (!typeDocument) { setErreur('Sélectionnez un type de document.'); return; }
    if (!numeroDocument.trim()) { setErreur('Saisissez le numéro du document.'); return; }
    setErreur('');
    setEtape(1);
  };

  const validerEtape2 = () => {
    if (!photoRecto) { setErreur('La photo recto est obligatoire.'); return; }
    setErreur('');
    setEtape(2);
  };

  // ── Soumission finale ────────────────────────────────────────────────────────

  const soumettreDossier = async () => {
    if (!photoSelfie) { setErreur('La photo selfie est obligatoire.'); return; }
    setErreur('');
    try {
      await soumettre.mutateAsync({
        clientId,
        typeDocument,
        numeroDocument,
        dateExpiration: dateExpiration || undefined,
        paysEmetteur: paysEmetteur || undefined,
        photoRecto: photoRecto ?? undefined,
        photoVerso: photoVerso ?? undefined,
        photoSelfie: photoSelfie ?? undefined,
      });
      setSucces('Dossier soumis pour vérification.');
    } catch (err) {
      setErreur(erreurApi(err));
    }
  };

  // ── Actions admin ────────────────────────────────────────────────────────────

  const validerDossier = async () => {
    if (!dossier) return;
    setErreur('');
    try {
      await valider.mutateAsync({ id: dossier.id, commentaire: commentaireAdmin || undefined });
      setSucces('Dossier KYC validé avec succès.');
    } catch (err) {
      setErreur(erreurApi(err));
    }
  };

  const refuserDossier = async () => {
    if (!dossier) return;
    if (!commentaireAdmin.trim()) { setErreur('Saisissez une raison de refus.'); return; }
    setErreur('');
    try {
      await refuser.mutateAsync({ id: dossier.id, commentaire: commentaireAdmin });
      setSucces('Dossier KYC refusé.');
      setAfficheRefus(false);
    } catch (err) {
      setErreur(erreurApi(err));
    }
  };

  // ── Vue vérificateur ─────────────────────────────────────────────────────────

  const vuAdmin = estAdmin && dossier;

  // ── Rendu ────────────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: 'var(--color-surface)',
          borderRadius: 16,
          width: '100%',
          maxWidth: 560,
          maxHeight: '90vh',
          overflow: 'auto',
          padding: 28,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          position: 'relative',
        }}
      >
        {/* En-tête */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
              {vuAdmin ? 'Examen KYC' : 'Vérification KYC'}
            </h2>
            <p style={{ margin: '4px 0 0', color: 'var(--color-text-muted)', fontSize: 13 }}>{clientNom}</p>
            {dossier && (
              <span className={(STATUT_BADGE[dossier.statut] ?? STATUT_BADGE.EN_ATTENTE).cls} style={{ marginTop: 6, display: 'inline-block', fontSize: 11 }}>
                {(STATUT_BADGE[dossier.statut] ?? STATUT_BADGE.EN_ATTENTE).label}
              </span>
            )}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        {/* Message retour */}
        {succes && (
          <div style={{ background: 'var(--color-success-light)', color: 'var(--color-success)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13 }}>
            {succes}
          </div>
        )}
        {erreur && (
          <div style={{ background: 'var(--color-danger-light)', color: 'var(--color-danger)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13 }}>
            {erreur}
          </div>
        )}

        {/* ── VUE VÉRIFICATEUR ── */}
        {vuAdmin ? (
          <div>
            {/* Infos document */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 2 }}>Type</div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{dossier.typeDocument ?? '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 2 }}>Numéro</div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{dossier.numeroDocument ?? '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 2 }}>Expiration</div>
                <div style={{ fontSize: 14 }}>{dossier.dateExpiration ? new Date(dossier.dateExpiration).toLocaleDateString('fr-CI') : '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 2 }}>Pays émetteur</div>
                <div style={{ fontSize: 14 }}>{dossier.paysEmetteur ?? '—'}</div>
              </div>
            </div>

            {/* Photos */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
              {[
                { label: 'Recto', src: dossier.photoRecto },
                { label: 'Verso', src: dossier.photoVerso },
                { label: 'Selfie', src: dossier.photoSelfie },
              ].map(({ label, src }) => (
                <div key={label} style={{ border: '1px solid var(--color-border)', borderRadius: 8, overflow: 'hidden', background: 'var(--color-surface-2)' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, padding: '6px 8px', borderBottom: '1px solid var(--color-border)' }}>{label}</div>
                  {src ? (
                    <div style={{ position: 'relative' }}>
                      <img src={src} alt={label} style={{ width: '100%', height: 100, objectFit: 'cover' }} />
                      <a
                        href={src}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          position: 'absolute', bottom: 4, right: 4,
                          background: 'rgba(0,0,0,0.6)', borderRadius: 4, padding: 4,
                          color: '#fff', display: 'flex',
                        }}
                      >
                        <Eye size={12} />
                      </a>
                    </div>
                  ) : (
                    <div style={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', fontSize: 11 }}>
                      Non fourni
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Commentaire refus si existant */}
            {dossier.commentaire && dossier.statut === 'REFUSE' && (
              <div style={{ background: 'var(--color-danger-light)', color: 'var(--color-danger)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13 }}>
                <strong>Motif du refus :</strong> {dossier.commentaire}
              </div>
            )}

            {/* Actions (uniquement si pas encore traité) */}
            {(dossier.statut === 'EN_COURS' || dossier.statut === 'EN_ATTENTE') && !succes && (
              <>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 13 }}>
                    Note / Commentaire <span style={{ fontWeight: 400, color: 'var(--color-text-muted)' }}>(optionnel pour validation)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={commentaireAdmin}
                    onChange={(e) => setCommentaireAdmin(e.target.value)}
                    placeholder="Note pour le vérificateur…"
                    style={{
                      width: '100%', borderRadius: 8, padding: '8px 12px',
                      border: '1px solid var(--color-border)', background: 'var(--color-surface-2)',
                      color: 'var(--color-text)', resize: 'vertical', fontSize: 13, boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={validerDossier}
                    disabled={isMutating}
                    style={{
                      flex: 1, padding: '10px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
                      background: 'var(--color-success)', color: '#fff', fontWeight: 700, fontSize: 14,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      opacity: isMutating ? 0.6 : 1,
                    }}
                  >
                    <CheckCircle size={16} /> Valider
                  </button>
                  <button
                    onClick={() => setAfficheRefus(!afficheRefus)}
                    disabled={isMutating}
                    style={{
                      flex: 1, padding: '10px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
                      background: 'var(--color-danger)', color: '#fff', fontWeight: 700, fontSize: 14,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      opacity: isMutating ? 0.6 : 1,
                    }}
                  >
                    <XCircle size={16} /> Refuser
                  </button>
                </div>
                {afficheRefus && (
                  <div style={{ marginTop: 12, padding: 14, background: 'var(--color-danger-light)', borderRadius: 8 }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 13, color: 'var(--color-danger)' }}>
                      Raison du refus <span style={{ color: 'var(--color-danger)' }}>*</span>
                    </label>
                    <textarea
                      rows={2}
                      value={commentaireAdmin}
                      onChange={(e) => setCommentaireAdmin(e.target.value)}
                      placeholder="Expliquez pourquoi le dossier est refusé…"
                      style={{
                        width: '100%', borderRadius: 8, padding: '8px 12px',
                        border: '1px solid var(--color-danger)', background: '#fff',
                        color: 'var(--color-text)', resize: 'vertical', fontSize: 13, boxSizing: 'border-box',
                      }}
                    />
                    <button
                      onClick={refuserDossier}
                      disabled={isMutating || !commentaireAdmin.trim()}
                      style={{
                        marginTop: 10, padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
                        background: 'var(--color-danger)', color: '#fff', fontWeight: 700, fontSize: 13,
                        opacity: (isMutating || !commentaireAdmin.trim()) ? 0.6 : 1,
                      }}
                    >
                      Confirmer le refus
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          /* ── VUE SOUMISSION ── */
          <>
            <Stepper etape={etape} total={3} />

            {/* Étape 1 — Informations document */}
            {etape === 0 && (
              <div>
                <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>Étape 1 — Informations du document</h3>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 13 }}>
                    Type de document <span style={{ color: 'var(--color-danger)' }}>*</span>
                  </label>
                  <select
                    value={typeDocument}
                    onChange={(e) => setTypeDocument(e.target.value)}
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: 8,
                      border: '1px solid var(--color-border)', background: 'var(--color-surface-2)',
                      color: 'var(--color-text)', fontSize: 13, boxSizing: 'border-box',
                    }}
                  >
                    <option value="">Sélectionner…</option>
                    {TYPES_DOCUMENT.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 13 }}>
                    Numéro du document <span style={{ color: 'var(--color-danger)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={numeroDocument}
                    onChange={(e) => setNumeroDocument(e.target.value)}
                    placeholder="ex: CI0012345678"
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: 8,
                      border: '1px solid var(--color-border)', background: 'var(--color-surface-2)',
                      color: 'var(--color-text)', fontSize: 13, boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 13 }}>Date d'expiration</label>
                    <input
                      type="date"
                      value={dateExpiration}
                      onChange={(e) => setDateExpiration(e.target.value)}
                      style={{
                        width: '100%', padding: '9px 12px', borderRadius: 8,
                        border: '1px solid var(--color-border)', background: 'var(--color-surface-2)',
                        color: 'var(--color-text)', fontSize: 13, boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 13 }}>Pays émetteur</label>
                    <input
                      type="text"
                      value={paysEmetteur}
                      onChange={(e) => setPaysEmetteur(e.target.value)}
                      placeholder="ex: Côte d'Ivoire"
                      style={{
                        width: '100%', padding: '9px 12px', borderRadius: 8,
                        border: '1px solid var(--color-border)', background: 'var(--color-surface-2)',
                        color: 'var(--color-text)', fontSize: 13, boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    onClick={validerEtape1}
                    style={{
                      padding: '10px 24px', borderRadius: 8, border: 'none', cursor: 'pointer',
                      background: 'var(--color-primary)', color: '#fff', fontWeight: 700, fontSize: 14,
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}
                  >
                    Suivant <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Étape 2 — Photos du document */}
            {etape === 1 && (
              <div>
                <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>Étape 2 — Photos du document</h3>
                <UploadZone label="Photo recto" dataUrl={photoRecto} onChange={setPhotoRecto} obligatoire />
                <UploadZone label="Photo verso (si applicable)" dataUrl={photoVerso} onChange={setPhotoVerso} />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <button
                    onClick={() => { setErreur(''); setEtape(0); }}
                    style={{
                      padding: '10px 20px', borderRadius: 8, border: '1px solid var(--color-border)',
                      background: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14,
                      display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-text)',
                    }}
                  >
                    <ChevronLeft size={16} /> Retour
                  </button>
                  <button
                    onClick={validerEtape2}
                    style={{
                      padding: '10px 24px', borderRadius: 8, border: 'none', cursor: 'pointer',
                      background: 'var(--color-primary)', color: '#fff', fontWeight: 700, fontSize: 14,
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}
                  >
                    Suivant <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Étape 3 — Selfie */}
            {etape === 2 && (
              <div>
                <h3 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700 }}>Étape 3 — Selfie de vérification</h3>
                <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 16 }}>
                  Tenez votre document face à la caméra, visage bien visible. La photo doit être nette et bien éclairée.
                </p>
                <UploadZone label="Photo selfie avec le document" dataUrl={photoSelfie} onChange={setPhotoSelfie} obligatoire />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <button
                    onClick={() => { setErreur(''); setEtape(1); }}
                    style={{
                      padding: '10px 20px', borderRadius: 8, border: '1px solid var(--color-border)',
                      background: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14,
                      display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-text)',
                    }}
                  >
                    <ChevronLeft size={16} /> Retour
                  </button>
                  <button
                    onClick={soumettreDossier}
                    disabled={isMutating || !!succes}
                    style={{
                      padding: '10px 24px', borderRadius: 8, border: 'none', cursor: 'pointer',
                      background: 'var(--color-primary)', color: '#fff', fontWeight: 700, fontSize: 14,
                      opacity: (isMutating || !!succes) ? 0.6 : 1,
                    }}
                  >
                    {isMutating ? 'Envoi en cours…' : 'Soumettre pour vérification'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
