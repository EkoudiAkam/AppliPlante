// FILE: tests/plant-details.spec.ts
describe('Plant Details Page', () => {
  beforeEach(() => {
    // Se connecter avant chaque test
    cy.login('test@example.com', 'password123');
    
    // Aller à la page des plantes
    cy.visit('/plants');
    
    // Attendre que les plantes se chargent
    cy.get('[data-testid="plant-card"]').should('be.visible');
  });

  it('should display plant details when clicking on a plant', () => {
    // Cliquer sur la première plante
    cy.get('[data-testid="plant-card"]').first().click();
    
    // Vérifier qu'on est sur la page de détails
    cy.url().should('include', '/plants/');
    
    // Vérifier que les informations de la plante sont affichées
    cy.get('[data-testid="plant-name"]').should('be.visible');
    cy.get('[data-testid="plant-species"]').should('be.visible');
    cy.get('[data-testid="plant-image"]').should('be.visible');
    cy.get('[data-testid="next-watering"]').should('be.visible');
  });

  it('should display watering history', () => {
    // Aller sur une page de détails de plante
    cy.get('[data-testid="plant-card"]').first().click();
    
    // Vérifier que la section historique des arrosages est présente
    cy.get('[data-testid="watering-history"]').should('be.visible');
    
    // Vérifier qu'il y a au moins un élément d'historique ou un message "Aucun arrosage"
    cy.get('[data-testid="watering-history"]').within(() => {
      cy.get('[data-testid="watering-item"], [data-testid="no-waterings"]').should('exist');
    });
  });

  it('should allow watering a plant', () => {
    // Aller sur une page de détails de plante
    cy.get('[data-testid="plant-card"]').first().click();
    
    // Cliquer sur le bouton d'arrosage
    cy.get('[data-testid="water-plant-button"]').click();
    
    // Confirmer l'arrosage dans la modal
    cy.get('[data-testid="confirm-watering"]').click();
    
    // Vérifier que l'arrosage a été enregistré
    cy.get('[data-testid="success-message"]').should('contain', 'Plante arrosée');
    
    // Vérifier que la date du prochain arrosage a été mise à jour
    cy.get('[data-testid="next-watering"]').should('not.contain', 'Maintenant');
  });

  it('should display watering calendar', () => {
    // Aller sur une page de détails de plante
    cy.get('[data-testid="plant-card"]').first().click();
    
    // Vérifier que le calendrier d'arrosage est présent
    cy.get('[data-testid="watering-calendar"]').should('be.visible');
    
    // Vérifier qu'il y a 7 jours affichés
    cy.get('[data-testid="calendar-day"]').should('have.length', 7);
    
    // Vérifier que le jour actuel est marqué
    cy.get('[data-testid="calendar-day"][data-is-today="true"]').should('exist');
  });

  it('should allow editing plant information', () => {
    // Aller sur une page de détails de plante
    cy.get('[data-testid="plant-card"]').first().click();
    
    // Cliquer sur le bouton d'édition
    cy.get('[data-testid="edit-plant-button"]').click();
    
    // Vérifier qu'on est redirigé vers la page d'édition
    cy.url().should('include', '/edit');
    
    // Vérifier que le formulaire d'édition est présent
    cy.get('[data-testid="plant-form"]').should('be.visible');
  });

  it('should allow deleting a plant with confirmation', () => {
    // Aller sur une page de détails de plante
    cy.get('[data-testid="plant-card"]').first().click();
    
    // Ouvrir le menu d'actions
    cy.get('[data-testid="plant-actions-menu"]').click();
    
    // Cliquer sur supprimer
    cy.get('[data-testid="delete-plant-button"]').click();
    
    // Confirmer la suppression
    cy.get('[data-testid="confirm-delete"]').click();
    
    // Vérifier qu'on est redirigé vers la liste des plantes
    cy.url().should('eq', Cypress.config().baseUrl + '/plants');
    
    // Vérifier le message de succès
    cy.get('[data-testid="success-message"]').should('contain', 'supprimée');
  });

  it('should handle plant not found', () => {
    // Aller sur une page de plante inexistante
    cy.visit('/plants/999999');
    
    // Vérifier qu'un message d'erreur est affiché
    cy.get('[data-testid="error-message"]').should('contain', 'Plante non trouvée');
    
    // Vérifier qu'il y a un lien pour retourner à la liste
    cy.get('[data-testid="back-to-plants"]').should('be.visible');
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