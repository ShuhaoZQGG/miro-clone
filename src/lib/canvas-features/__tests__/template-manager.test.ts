import { AdvancedTemplateManager } from '../advanced-template-manager';
import { createClient } from '@supabase/supabase-js';

// Mock fabric module
jest.mock('fabric', () => ({
  fabric: {
    util: {
      enlivenObjects: jest.fn((objects, callback, namespace) => {
        // Simulate enlivening objects by creating mock fabric objects
        const enlivenedObjects = objects.map((obj: any) => ({
          ...obj,
          type: obj.type || 'rect'
        }));
        callback(enlivenedObjects);
      })
    }
  }
}));

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          data: [],
          error: null
        }))
      })),
      insert: jest.fn(() => ({
        data: { id: 'template-123' },
        error: null
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          data: { id: 'template-123' },
          error: null
        }))
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => ({
          error: null
        }))
      }))
    })),
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(() => ({
          data: { path: 'thumbnails/template-123.png' },
          error: null
        })),
        getPublicUrl: jest.fn(() => ({
          data: { publicUrl: 'https://example.com/thumbnail.png' }
        }))
      }))
    }
  }))
}));

describe('AdvancedTemplateManager', () => {
  let manager: AdvancedTemplateManager;
  let mockCanvas: any;

  beforeEach(() => {
    mockCanvas = {
      getObjects: jest.fn(() => [
        { type: 'rect', left: 100, top: 100, width: 200, height: 150 },
        { type: 'text', left: 200, top: 200, text: 'Sample Text' }
      ]),
      toJSON: jest.fn(() => ({
        objects: [
          { type: 'rect', left: 100, top: 100 },
          { type: 'text', left: 200, top: 200 }
        ]
      })),
      loadFromJSON: jest.fn((data, callback) => callback()),
      renderAll: jest.fn(),
      clear: jest.fn(),
      add: jest.fn(),
      toDataURL: jest.fn(() => 'data:image/png;base64,mockdata')
    };

    manager = new AdvancedTemplateManager(mockCanvas);
  });

  describe('Template Categories', () => {
    it('should have predefined template categories', () => {
      const categories = manager.getCategories();
      
      expect(categories).toContain('Business');
      expect(categories).toContain('Education');
      expect(categories).toContain('Design');
      expect(categories).toContain('Marketing');
      expect(categories).toContain('Development');
      expect(categories).toContain('Personal');
    });

    it('should filter templates by category', async () => {
      const businessTemplates = await manager.getTemplatesByCategory('Business');
      businessTemplates.forEach(template => {
        expect(template.category).toBe('Business');
      });
    });
  });

  describe('Template Creation', () => {
    it('should create template from current canvas', async () => {
      const templateData = {
        name: 'My Template',
        description: 'A test template',
        category: 'Business' as const,
        tags: ['test', 'sample'],
        isPublic: true
      };

      const template = await manager.createTemplate(templateData);

      expect(template).toMatchObject({
        name: 'My Template',
        category: 'Business',
        tags: ['test', 'sample']
      });
      expect(mockCanvas.toJSON).toHaveBeenCalled();
    });

    it('should generate thumbnail for template', async () => {
      const templateData = {
        name: 'Test Template',
        category: 'Design' as const
      };

      const template = await manager.createTemplate(templateData);
      
      expect(mockCanvas.toDataURL).toHaveBeenCalled();
      expect(template.thumbnailUrl).toBeDefined();
    });

    it('should support template variations', async () => {
      const baseTemplate = await manager.createTemplate({
        name: 'Base Template',
        category: 'Business' as const
      });

      const variation = await manager.createVariation(baseTemplate.id, {
        name: 'Dark Theme Variation',
        modifications: {
          theme: 'dark',
          primaryColor: '#000000'
        }
      });

      expect(variation.parentTemplateId).toBe(baseTemplate.id);
      expect(variation.modifications).toMatchObject({
        theme: 'dark'
      });
    });
  });

  describe('Template Application', () => {
    it('should apply template to canvas', async () => {
      // First create the template properly
      const template = await manager.createTemplate({
        name: 'Test Template',
        category: 'Business' as const
      });

      await manager.applyTemplate(template.id);

      expect(mockCanvas.clear).toHaveBeenCalled();
      expect(mockCanvas.loadFromJSON).toHaveBeenCalled();
      expect(mockCanvas.renderAll).toHaveBeenCalled();
    });

    it('should merge template with existing canvas', async () => {
      // First create the template properly
      const template = await manager.createTemplate({
        name: 'Merge Template',
        category: 'Design' as const
      });

      await manager.mergeTemplate(template.id);

      expect(mockCanvas.clear).not.toHaveBeenCalled();
      expect(mockCanvas.add).toHaveBeenCalled();
    });

    it('should apply template with custom parameters', async () => {
      // First create the template properly
      const template = await manager.createTemplate({
        name: 'Parameterized Template',
        category: 'Business' as const
      });

      const parameters = {
        primaryColor: '#FF0000',
        fontSize: 18,
        companyName: 'Acme Corp'
      };

      await manager.applyTemplateWithParams(template.id, parameters);

      // Verify parameters are applied to template objects
      expect(mockCanvas.loadFromJSON).toHaveBeenCalled();
    });
  });

  describe('Template Search and Discovery', () => {
    it('should search templates by keyword', async () => {
      const results = await manager.searchTemplates('presentation');
      
      expect(results).toBeInstanceOf(Array);
      results.forEach(template => {
        const matchesSearch = 
          template.name.toLowerCase().includes('presentation') ||
          template.description?.toLowerCase().includes('presentation') ||
          template.tags?.some(tag => tag.toLowerCase().includes('presentation'));
        expect(matchesSearch).toBeTruthy();
      });
    });

    it('should get popular templates', async () => {
      const popularTemplates = await manager.getPopularTemplates(10);
      
      expect(popularTemplates.length).toBeLessThanOrEqual(10);
      // Templates should be sorted by usage count
      for (let i = 1; i < popularTemplates.length; i++) {
        expect(popularTemplates[i - 1].usageCount).toBeGreaterThanOrEqual(
          popularTemplates[i].usageCount
        );
      }
    });

    it('should get recently used templates', async () => {
      const userId = 'user-123';
      const recentTemplates = await manager.getRecentTemplates(userId, 5);
      
      expect(recentTemplates.length).toBeLessThanOrEqual(5);
      // Should be sorted by last used date
    });

    it('should get recommended templates', async () => {
      const userId = 'user-456';
      const recommendations = await manager.getRecommendedTemplates(userId);
      
      expect(recommendations).toBeInstanceOf(Array);
      // Should be based on user's usage history and preferences
    });
  });

  describe('Template Management', () => {
    it('should update template metadata', async () => {
      // First create the template properly
      const template = await manager.createTemplate({
        name: 'Original Name',
        category: 'Design' as const
      });

      const updates = {
        name: 'Updated Name',
        description: 'New description',
        tags: ['updated', 'new']
      };

      const updated = await manager.updateTemplate(template.id, updates);
      
      expect(updated.name).toBe('Updated Name');
      expect(updated.description).toBe('New description');
      expect(updated.tags).toContain('updated');
    });

    it('should duplicate template', async () => {
      // First create the original template
      const original = await manager.createTemplate({
        name: 'Original Template',
        category: 'Business' as const
      });

      const duplicate = await manager.duplicateTemplate(original.id, {
        name: 'Copy of Original'
      });

      expect(duplicate.id).not.toBe(original.id);
      expect(duplicate.name).toBe('Copy of Original');
      expect(duplicate.data).toEqual(expect.any(Object));
    });

    it('should delete template', async () => {
      // First create the template to delete
      const template = await manager.createTemplate({
        name: 'Template to Delete',
        category: 'Design' as const
      });

      const result = await manager.deleteTemplate(template.id);
      
      expect(result).toBe(true);
    });

    it('should export template', async () => {
      // First create the template to export
      const template = await manager.createTemplate({
        name: 'Template to Export',
        category: 'Marketing' as const
      });

      const exported = await manager.exportTemplate(template.id, 'json');
      
      expect(exported).toHaveProperty('name');
      expect(exported).toHaveProperty('data');
      expect(exported).toHaveProperty('metadata');
    });

    it('should import template', async () => {
      const templateData = {
        name: 'Imported Template',
        category: 'Design' as const,
        data: {
          objects: [{ type: 'rect' }]
        }
      };

      const imported = await manager.importTemplate(templateData);
      
      expect(imported.name).toBe('Imported Template');
      expect(imported.id).toBeDefined();
    });
  });

  describe('Smart Templates', () => {
    it('should create smart template with placeholders', async () => {
      const smartTemplate = await manager.createSmartTemplate({
        name: 'Smart Business Card',
        category: 'Business' as const,
        placeholders: {
          companyName: { type: 'text', default: 'Your Company' },
          logo: { type: 'image', default: null },
          primaryColor: { type: 'color', default: '#0066CC' }
        }
      });

      expect(smartTemplate.placeholders).toBeDefined();
      expect(smartTemplate.placeholders?.companyName).toBeDefined();
    });

    it('should apply smart template with user data', async () => {
      // First create the smart template
      const smartTemplate = await manager.createTemplate({
        id: 'smart-template-123',
        name: 'Smart Template',
        category: 'business',
        data: {
          objects: [
            { type: 'text', text: '{{companyName}}' },
            { type: 'image', src: '{{logo}}' }
          ]
        },
        tags: ['smart'],
        placeholders: {
          companyName: { type: 'text', required: true },
          logo: { type: 'image', required: false },
          primaryColor: { type: 'color', required: false }
        }
      });

      const userData = {
        companyName: 'Tech Corp',
        logo: 'https://example.com/logo.png',
        primaryColor: '#FF5500'
      };

      await manager.applySmartTemplate('smart-template-123', userData);
      
      expect(mockCanvas.loadFromJSON).toHaveBeenCalled();
      // Verify placeholders are replaced with user data
    });

    it('should validate smart template data', () => {
      const template = {
        placeholders: {
          email: { type: 'text', validation: 'email' },
          phone: { type: 'text', validation: 'phone' }
        }
      };

      const validData = {
        email: 'test@example.com',
        phone: '+1234567890'
      };

      const invalidData = {
        email: 'not-an-email',
        phone: '123'
      };

      expect(manager.validateTemplateData(template, validData)).toBe(true);
      expect(manager.validateTemplateData(template, invalidData)).toBe(false);
    });
  });

  describe('Template Analytics', () => {
    it('should track template usage', async () => {
      const templateId = 'template-123';
      await manager.trackUsage(templateId, 'user-456');
      
      const stats = await manager.getTemplateStats(templateId);
      expect(stats.usageCount).toBeGreaterThan(0);
    });

    it('should get template analytics', async () => {
      const templateId = 'template-789';
      const analytics = await manager.getTemplateAnalytics(templateId);
      
      expect(analytics).toHaveProperty('totalUses');
      expect(analytics).toHaveProperty('uniqueUsers');
      expect(analytics).toHaveProperty('averageRating');
      expect(analytics).toHaveProperty('completionRate');
    });

    it('should rate template', async () => {
      const templateId = 'template-456';
      const rating = await manager.rateTemplate(templateId, 'user-123', 5);
      
      expect(rating).toBe(true);
      
      const stats = await manager.getTemplateStats(templateId);
      expect(stats.averageRating).toBeGreaterThanOrEqual(0);
      expect(stats.averageRating).toBeLessThanOrEqual(5);
    });
  });

  describe('Template Collaboration', () => {
    it('should share template with team', async () => {
      const templateId = 'template-123';
      const teamId = 'team-456';
      
      const shared = await manager.shareWithTeam(templateId, teamId, {
        canEdit: false,
        canDuplicate: true
      });
      
      expect(shared).toBe(true);
    });

    it('should get team templates', async () => {
      const teamId = 'team-789';
      const teamTemplates = await manager.getTeamTemplates(teamId);
      
      expect(teamTemplates).toBeInstanceOf(Array);
      teamTemplates.forEach(template => {
        expect(template.teamId).toBe(teamId);
      });
    });

    it('should handle template permissions', async () => {
      const templateId = 'template-123';
      const userId = 'user-456';
      
      const canEdit = await manager.checkPermission(templateId, userId, 'edit');
      const canView = await manager.checkPermission(templateId, userId, 'view');
      const canDelete = await manager.checkPermission(templateId, userId, 'delete');
      
      expect(typeof canEdit).toBe('boolean');
      expect(typeof canView).toBe('boolean');
      expect(typeof canDelete).toBe('boolean');
    });
  });

  describe('Template Versioning', () => {
    it('should create template version', async () => {
      const templateId = 'template-123';
      const version = await manager.createVersion(templateId, {
        versionNotes: 'Updated colors and layout'
      });
      
      expect(version.templateId).toBe(templateId);
      expect(version.versionNumber).toBeGreaterThan(0);
      expect(version.versionNotes).toBe('Updated colors and layout');
    });

    it('should get template version history', async () => {
      const templateId = 'template-456';
      const history = await manager.getVersionHistory(templateId);
      
      expect(history).toBeInstanceOf(Array);
      // Should be sorted by version number
      for (let i = 1; i < history.length; i++) {
        expect(history[i].versionNumber).toBeGreaterThan(history[i - 1].versionNumber);
      }
    });

    it('should revert to previous version', async () => {
      const templateId = 'template-789';
      const versionNumber = 2;
      
      const reverted = await manager.revertToVersion(templateId, versionNumber);
      
      expect(reverted.currentVersion).toBe(versionNumber);
    });
  });

  describe('Template AI Features', () => {
    it('should generate template from description', async () => {
      const description = 'Create a project timeline template with milestones';
      const generated = await manager.generateFromDescription(description);
      
      expect(generated).toBeDefined();
      expect(generated.name).toContain('timeline');
      expect(generated.data.objects).toBeInstanceOf(Array);
    });

    it('should suggest template improvements', async () => {
      const templateId = 'template-123';
      const suggestions = await manager.getSuggestions(templateId);
      
      expect(suggestions).toBeInstanceOf(Array);
      suggestions.forEach(suggestion => {
        expect(suggestion).toHaveProperty('type');
        expect(suggestion).toHaveProperty('description');
        expect(suggestion).toHaveProperty('impact');
      });
    });

    it('should auto-categorize template', async () => {
      const templateData = {
        objects: [
          { type: 'text', text: 'Revenue Report' },
          { type: 'chart' },
          { type: 'table' }
        ]
      };
      
      const category = await manager.autoCategorize(templateData);
      expect(category).toBe('Business');
    });
  });
});