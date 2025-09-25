// FILE: tests/profile.spec.ts
describe('Profile Page', () => {
  beforeEach(() => {
    // Se connecter avant chaque test
    cy.login('test@example.com', 'password123');
    
    // Aller à la page de profil
    cy.visit('/profile');
  });

  it('should display user profile information', () => {
    // Vérifier que la page de profil se charge
    cy.get('[data-testid="profile-page"]').should('be.visible');
    
    // Vérifier que les informations utilisateur sont affichées
    cy.get('[data-testid="user-email"]').should('be.visible');
    cy.get('[data-testid="user-firstname"]').should('be.visible');
    cy.get('[data-testid="user-lastname"]').should('be.visible');
    
    // Vérifier que les statistiques sont affichées
    cy.get('[data-testid="user-stats"]').should('be.visible');
    cy.get('[data-testid="total-plants"]').should('be.visible');
    cy.get('[data-testid="total-waterings"]').should('be.visible');
  });

  it('should allow editing firstname', () => {
    // Cliquer sur le bouton d'édition du profil
    cy.get('[data-testid="edit-profile-button"]').click();
    
    // Modifier le prénom
    const newFirstname = 'NouveauPrenom';
    cy.get('[data-testid="firstname-input"]').clear().type(newFirstname);
    
    // Sauvegarder les modifications
    cy.get('[data-testid="save-profile-button"]').click();
    
    // Vérifier le message de succès
    cy.get('[data-testid="success-message"]').should('contain', 'Profil mis à jour');
    
    // Vérifier que le prénom a été mis à jour
    cy.get('[data-testid="user-firstname"]').should('contain', newFirstname);
  });

  it('should allow editing lastname', () => {
    // Cliquer sur le bouton d'édition du profil
    cy.get('[data-testid="edit-profile-button"]').click();
    
    // Modifier le nom de famille
    const newLastname = 'NouveauNom';
    cy.get('[data-testid="lastname-input"]').clear().type(newLastname);
    
    // Sauvegarder les modifications
    cy.get('[data-testid="save-profile-button"]').click();
    
    // Vérifier le message de succès
    cy.get('[data-testid="success-message"]').should('contain', 'Profil mis à jour');
    
    // Vérifier que le nom a été mis à jour
    cy.get('[data-testid="user-lastname"]').should('contain', newLastname);
  });

  it('should allow editing email', () => {
    // Cliquer sur le bouton d'édition du profil
    cy.get('[data-testid="edit-profile-button"]').click();
    
    // Modifier l'email
    const newEmail = 'nouveau@example.com';
    cy.get('[data-testid="email-input"]').clear().type(newEmail);
    
    // Sauvegarder les modifications
    cy.get('[data-testid="save-profile-button"]').click();
    
    // Vérifier le message de succès
    cy.get('[data-testid="success-message"]').should('contain', 'Profil mis à jour');
    
    // Vérifier que l'email a été mis à jour
    cy.get('[data-testid="user-email"]').should('contain', newEmail);
  });

  it('should validate form fields', () => {
    // Cliquer sur le bouton d'édition du profil
    cy.get('[data-testid="edit-profile-button"]').click();
    
    // Vider le champ email
    cy.get('[data-testid="email-input"]').clear();
    
    // Essayer de sauvegarder
    cy.get('[data-testid="save-profile-button"]').click();
    
    // Vérifier qu'un message d'erreur de validation est affiché
    cy.get('[data-testid="email-error"]').should('be.visible');
    
    // Entrer un email invalide
    cy.get('[data-testid="email-input"]').type('email-invalide');
    
    // Essayer de sauvegarder
    cy.get('[data-testid="save-profile-button"]').click();
    
    // Vérifier qu'un message d'erreur de validation est affiché
    cy.get('[data-testid="email-error"]').should('contain', 'Email invalide');
  });

  it('should display account creation and modification dates', () => {
    // Vérifier que les dates sont affichées
    cy.get('[data-testid="account-created"]').should('be.visible');
    cy.get('[data-testid="account-updated"]').should('be.visible');
    
    // Vérifier le format des dates
    cy.get('[data-testid="account-created"]').should('match', /\d{2}\/\d{2}\/\d{4}/);
    cy.get('[data-testid="account-updated"]').should('match', /\d{2}\/\d{2}\/\d{4}/);
  });

  it('should show delete account option in danger zone', () => {
    // Vérifier que la zone de danger est présente
    cy.get('[data-testid="danger-zone"]').should('be.visible');
    
    // Vérifier que le bouton de suppression de compte est présent
    cy.get('[data-testid="delete-account-button"]').should('be.visible');
    
    // Vérifier que le bouton est bien stylé en rouge (danger)
    cy.get('[data-testid="delete-account-button"]').should('have.class', 'bg-red-600');
  });

  it('should require confirmation for account deletion', () => {
    // Cliquer sur le bouton de suppression de compte
    cy.get('[data-testid="delete-account-button"]').click();
    
    // Vérifier qu'une modal de confirmation s'ouvre
    cy.get('[data-testid="delete-confirmation-modal"]').should('be.visible');
    
    // Vérifier le message d'avertissement
    cy.get('[data-testid="delete-warning"]').should('contain', 'irréversible');
    
    // Annuler la suppression
    cy.get('[data-testid="cancel-delete"]').click();
    
    // Vérifier que la modal se ferme
    cy.get('[data-testid="delete-confirmation-modal"]').should('not.exist');
  });

  it('should handle profile update errors', () => {
    // Intercepter la requête de mise à jour pour simuler une erreur
    cy.intercept('PUT', '/api/users/profile', {
      statusCode: 400,
      body: { message: 'Email déjà utilisé' }
    }).as('updateProfileError');
    
    // Cliquer sur le bouton d'édition du profil
    cy.get('[data-testid="edit-profile-button"]').click();
    
    // Modifier l'email
    cy.get('[data-testid="email-input"]').clear().type('existing@example.com');
    
    // Sauvegarder les modifications
    cy.get('[data-testid="save-profile-button"]').click();
    
    // Attendre la requête
    cy.wait('@updateProfileError');
    
    // Vérifier qu'un message d'erreur est affiché
    cy.get('[data-testid="error-message"]').should('contain', 'Email déjà utilisé');
  });

  it('should cancel profile editing', () => {
    // Cliquer sur le bouton d'édition du profil
    cy.get('[data-testid="edit-profile-button"]').click();
    
    // Modifier un champ
    cy.get('[data-testid="firstname-input"]').clear().type('NouveauPrenom');
    
    // Annuler les modifications
    cy.get('[data-testid="cancel-edit-button"]').click();
    
    // Vérifier que le mode édition est désactivé
    cy.get('[data-testid="firstname-input"]').should('not.exist');
    
    // Vérifier que les modifications n'ont pas été sauvegardées
    cy.get('[data-testid="user-firstname"]').should('not.contain', 'NouveauPrenom');
  });
});

// Commandes personnalisées pour les tests
declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>;
    }
  }
}

Cypress.Commands.add('login', (email: string, password: string) => {
  cy.session([email, password], () => {
    cy.visit('/login');
    cy.get('[data-testid="email-input"]').type(email);
    cy.get('[data-testid="password-input"]').type(password);
    cy.get('[data-testid="login-button"]').click();
    cy.url().should('not.include', '/login');
  });
});