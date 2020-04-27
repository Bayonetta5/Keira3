import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import Spy = jasmine.Spy;

import { MysqlQueryService } from '@keira-shared/services/mysql-query.service';
import { QuestTemplateAddonComponent } from './quest-template-addon.component';
import { EditorPageObject } from '@keira-testing/editor-page-object';
import { QuestTemplateAddon } from '@keira-types/quest-template-addon.type';
import { QuestHandlerService } from '../quest-handler.service';
import { SqliteQueryService } from '@keira-shared/services/sqlite-query.service';
import { instance } from 'ts-mockito';
import { MockedSqliteService } from '@keira-testing/mocks';
import { SqliteService } from '@keira-shared/services/sqlite.service';
import { QuestModule } from '../quest.module';
import { QuestPreviewService } from '../quest-preview/quest-preview.service';

class QuestTemplateAddonPage extends EditorPageObject<QuestTemplateAddonComponent> {}

describe('QuestTemplateAddon integration tests', () => {
  let component: QuestTemplateAddonComponent;
  let fixture: ComponentFixture<QuestTemplateAddonComponent>;
  let queryService: MysqlQueryService;
  let sqliteQueryService: SqliteQueryService;
  let querySpy: Spy;
  let handlerService: QuestHandlerService;
  let page: QuestTemplateAddonPage;

  const id = 1234;
  const expectedFullCreateQuery = 'DELETE FROM `quest_template_addon` WHERE (`ID` = 1234);\n' +
    'INSERT INTO `quest_template_addon` (`ID`, `MaxLevel`, `AllowableClasses`, `SourceSpellID`, `PrevQuestID`, `NextQuestID`, ' +
    '`ExclusiveGroup`, `RewardMailTemplateID`, `RewardMailDelay`, `RequiredSkillID`, `RequiredSkillPoints`,' +
    ' `RequiredMinRepFaction`, `RequiredMaxRepFaction`, `RequiredMinRepValue`, `RequiredMaxRepValue`, `ProvidedItemCount`, ' +
    '`SpecialFlags`) VALUES\n' +
    '(1234, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);';

  const originalEntity = new QuestTemplateAddon();
  originalEntity.ID = id;
  originalEntity.MaxLevel = 1;
  originalEntity.AllowableClasses = 2;
  originalEntity.SourceSpellID = 3;
  originalEntity.PrevQuestID = 4;
  originalEntity.NextQuestID = 5;
  originalEntity.ExclusiveGroup = 6;
  originalEntity.RewardMailTemplateID = 7;
  originalEntity.RewardMailDelay = 8;
  originalEntity.RequiredSkillID = 9;
  originalEntity.RequiredSkillPoints = 10;
  originalEntity.RequiredMinRepFaction = 11;
  originalEntity.RequiredMaxRepFaction = 12;
  originalEntity.RequiredMinRepValue = 13;
  originalEntity.RequiredMaxRepValue = 14;
  originalEntity.ProvidedItemCount = 15;
  originalEntity.SpecialFlags = 0;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        QuestModule,
      ],
      providers: [
        { provide: SqliteService, useValue: instance(MockedSqliteService) },
      ]
    })
      .compileComponents();

  }));

  function setup(creatingNew: boolean) {
    handlerService = TestBed.inject(QuestHandlerService);
    handlerService['_selected'] = `${id}`;
    handlerService.isNew = creatingNew;

    sqliteQueryService = TestBed.inject(SqliteQueryService);
    queryService = TestBed.inject(MysqlQueryService);
    querySpy = spyOn(queryService, 'query').and.returnValue(of());
    spyOn(sqliteQueryService, 'query').and.returnValue(of(
      [{ ID: 123, spellName: 'Mock Spell' }]
    ));

    spyOn(queryService, 'selectAll').and.returnValue(of(
      creatingNew ? [] : [originalEntity]
    ));
    // by default the other editor services should not be initialised, because the selectAll would return the wrong types for them
    const initializeServicesSpy = spyOn(TestBed.inject(QuestPreviewService), 'initializeServices');
    if (creatingNew) {
      // when creatingNew, the selectAll will return an empty array, so it's fine
      initializeServicesSpy.and.callThrough();
    }

    fixture = TestBed.createComponent(QuestTemplateAddonComponent);
    component = fixture.componentInstance;
    page = new QuestTemplateAddonPage(fixture);
    fixture.autoDetectChanges(true);
    fixture.detectChanges();
  }

  describe('Creating new', () => {
    beforeEach(() => setup(true));

    it('should correctly initialise', () => {
      page.expectQuerySwitchToBeHidden();
      page.expectFullQueryToBeShown();
      page.expectFullQueryToContain(expectedFullCreateQuery);
    });

    it('should correctly update the unsaved status', () => {
      const field = 'NextQuestID';
      expect(handlerService.isQuestTemplateAddonUnsaved).toBe(false);
      page.setInputValueById(field, 3);
      expect(handlerService.isQuestTemplateAddonUnsaved).toBe(true);
      page.setInputValueById(field, 0);
      expect(handlerService.isQuestTemplateAddonUnsaved).toBe(false);
    });

    it('changing a property and executing the query should correctly work', () => {
      const expectedQuery = 'DELETE FROM `quest_template_addon` WHERE (`ID` = 1234);\n' +
        'INSERT INTO `quest_template_addon` (`ID`, `MaxLevel`, `AllowableClasses`, `SourceSpellID`, `PrevQuestID`, `NextQuestID`,' +
        ' `ExclusiveGroup`, `RewardMailTemplateID`, `RewardMailDelay`, `RequiredSkillID`, `RequiredSkillPoints`,' +
        ' `RequiredMinRepFaction`, `RequiredMaxRepFaction`, `RequiredMinRepValue`, `RequiredMaxRepValue`, `ProvidedItemCount`,' +
        ' `SpecialFlags`) VALUES\n' +
        '(1234, 33, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);';
      querySpy.calls.reset();

      page.setInputValueById('MaxLevel', 33);
      page.clickExecuteQuery();

      page.expectFullQueryToContain(expectedQuery);
      expect(querySpy).toHaveBeenCalledTimes(1);
      expect(querySpy.calls.mostRecent().args[0]).toContain(expectedQuery);
    });
  });

  describe('Editing existing', () => {
    beforeEach(() => setup(false));

    it('should correctly initialise', () => {
      page.expectDiffQueryToBeShown();
      page.expectDiffQueryToBeEmpty();
      page.expectFullQueryToContain('DELETE FROM `quest_template_addon` WHERE (`ID` = 1234);\n' +
        'INSERT INTO `quest_template_addon` (`ID`, `MaxLevel`, `AllowableClasses`, `SourceSpellID`, `PrevQuestID`, `NextQuestID`,' +
        ' `ExclusiveGroup`, `RewardMailTemplateID`, `RewardMailDelay`, `RequiredSkillID`, `RequiredSkillPoints`,' +
        ' `RequiredMinRepFaction`, `RequiredMaxRepFaction`, `RequiredMinRepValue`, `RequiredMaxRepValue`, `ProvidedItemCount`,' +
        ' `SpecialFlags`) VALUES\n' +
        '(1234, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0);');
    });

    it('changing all properties and executing the query should correctly work', () => {
      const expectedQuery = 'UPDATE `quest_template_addon` SET ' +
        '`MaxLevel` = 0, `AllowableClasses` = 1, `SourceSpellID` = 2, `PrevQuestID` = 3, `NextQuestID` = 4, `ExclusiveGroup` = 5, ' +
        '`RewardMailTemplateID` = 6, `RewardMailDelay` = 7, `RequiredSkillID` = 8, `RequiredSkillPoints` = 9, ' +
        '`RequiredMinRepFaction` = 10, `RequiredMaxRepFaction` = 11, `RequiredMinRepValue` = 12, `RequiredMaxRepValue` = 13, ' +
        '`ProvidedItemCount` = 14, `SpecialFlags` = 15 WHERE (`ID` = 1234);';
      querySpy.calls.reset();

      page.changeAllFields(originalEntity, ['VerifiedBuild']);
      page.clickExecuteQuery();

      page.expectDiffQueryToContain(expectedQuery);
      expect(querySpy).toHaveBeenCalledTimes(2); // 2 because the preview also calls it
      expect(querySpy.calls.mostRecent().args[0]).toContain(expectedQuery);
    });

    it('changing values should correctly update the queries', () => {
      page.setInputValueById('PrevQuestID', '11');
      page.expectDiffQueryToContain(
        'UPDATE `quest_template_addon` SET `PrevQuestID` = 11 WHERE (`ID` = 1234);'
      );
      page.expectFullQueryToContain(
        'DELETE FROM `quest_template_addon` WHERE (`ID` = 1234);\n' +
        'INSERT INTO `quest_template_addon` (`ID`, `MaxLevel`, `AllowableClasses`, ' +
        '`SourceSpellID`, `PrevQuestID`, `NextQuestID`, `ExclusiveGroup`, `RewardMailTemplateID`,' +
        ' `RewardMailDelay`, `RequiredSkillID`, `RequiredSkillPoints`, `RequiredMinRepFaction`, ' +
        '`RequiredMaxRepFaction`, `RequiredMinRepValue`, `RequiredMaxRepValue`, `ProvidedItemCount`, `SpecialFlags`) VALUES\n' +
        '(1234, 1, 2, 3, 11, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0);'
      );

      page.setInputValueById('NextQuestID', '22');
      page.expectDiffQueryToContain(
        'UPDATE `quest_template_addon` SET `PrevQuestID` = 11, `NextQuestID` = 22 WHERE (`ID` = 1234);'
      );
      page.expectFullQueryToContain(
        'DELETE FROM `quest_template_addon` WHERE (`ID` = 1234);\n' +
        'INSERT INTO `quest_template_addon` (`ID`, `MaxLevel`, `AllowableClasses`, `SourceSpellID`, ' +
        '`PrevQuestID`, `NextQuestID`, `ExclusiveGroup`, `RewardMailTemplateID`, `RewardMailDelay`, ' +
        '`RequiredSkillID`, `RequiredSkillPoints`, `RequiredMinRepFaction`, `RequiredMaxRepFaction`, ' +
        '`RequiredMinRepValue`, `RequiredMaxRepValue`, `ProvidedItemCount`, `SpecialFlags`) VALUES\n' +
        '(1234, 1, 2, 3, 11, 22, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0);'
      );
    });

    it('changing a value via FlagsSelector should correctly work', async () => {
      const field = 'SpecialFlags';
      page.clickElement(page.getSelectorBtn(field));
      await page.whenReady();
      page.expectModalDisplayed();

      page.toggleFlagInRowExternal(1);
      await page.whenReady();
      page.toggleFlagInRowExternal(3);
      await page.whenReady();
      page.clickModalSelect();
      await page.whenReady();

      expect(page.getInputById(field).value).toEqual('10');
      page.expectDiffQueryToContain(
        'UPDATE `quest_template_addon` SET `SpecialFlags` = 10 WHERE (`ID` = 1234);'
      );

      page.expectFullQueryToContain('DELETE FROM `quest_template_addon` WHERE (`ID` = 1234);\n' +
        'INSERT INTO `quest_template_addon` (`ID`, `MaxLevel`, `AllowableClasses`, `SourceSpellID`, ' +
        '`PrevQuestID`, `NextQuestID`, `ExclusiveGroup`, `RewardMailTemplateID`, `RewardMailDelay`, ' +
        '`RequiredSkillID`, `RequiredSkillPoints`, `RequiredMinRepFaction`, `RequiredMaxRepFaction`, ' +
        '`RequiredMinRepValue`, `RequiredMaxRepValue`, `ProvidedItemCount`, `SpecialFlags`) VALUES\n' +
        '(1234, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 10)');
    });

    it('changing a value via SpellSelector should correctly work', async () => {

      //  note: previously disabled because of:
      //  https://stackoverflow.com/questions/57336982/how-to-make-angular-tests-wait-for-previous-async-operation-to-complete-before-e

      const field = 'SourceSpellID';
      page.clickElement(page.getSelectorBtn(field));
      await page.whenReady();
      page.expectModalDisplayed();

      page.clickSearchBtn();

      await fixture.whenStable();
      page.clickRowOfDatatableInModal(0);
      await page.whenReady();
      page.clickModalSelect();
      await page.whenReady();

      page.expectDiffQueryToContain(
        'UPDATE `quest_template_addon` SET `SourceSpellID` = 123 WHERE (`ID` = 1234);'
      );
      page.expectFullQueryToContain(
        'DELETE FROM `quest_template_addon` WHERE (`ID` = 1234);\n' +
        'INSERT INTO `quest_template_addon` (`ID`, `MaxLevel`, `AllowableClasses`, `SourceSpellID`, `PrevQuestID`, `NextQuestID`, ' +
        '`ExclusiveGroup`, `RewardMailTemplateID`, `RewardMailDelay`, `RequiredSkillID`, `RequiredSkillPoints`, `RequiredMinRepFaction`, ' +
        '`RequiredMaxRepFaction`, `RequiredMinRepValue`, `RequiredMaxRepValue`, `ProvidedItemCount`, `SpecialFlags`) VALUES\n' +
        '(1234, 1, 2, 123, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0);'
      );
    });

    it('changing a value via QuestSelector should correctly work', async () => {
      const field = 'NextQuestID';
      const mysqlQueryService = TestBed.inject(MysqlQueryService);
      (mysqlQueryService.query as Spy).and.returnValue(of(
        [{ ID: 123, LogTitle: 'Mock Quest' }]
      ));

      page.clickElement(page.getSelectorBtn(field));
      await page.whenReady();
      page.expectModalDisplayed();

      page.clickSearchBtn();

      await fixture.whenStable();
      page.clickRowOfDatatableInModal(0);
      await page.whenReady();
      page.clickModalSelect();
      await page.whenReady();

      page.expectDiffQueryToContain(
        'UPDATE `quest_template_addon` SET `NextQuestID` = 123 WHERE (`ID` = 1234);'
      );
      page.expectFullQueryToContain(
        'DELETE FROM `quest_template_addon` WHERE (`ID` = 1234);\n' +
        'INSERT INTO `quest_template_addon` (`ID`, `MaxLevel`, `AllowableClasses`, `SourceSpellID`, `PrevQuestID`, `NextQuestID`, ' +
        '`ExclusiveGroup`, `RewardMailTemplateID`, `RewardMailDelay`, `RequiredSkillID`, `RequiredSkillPoints`, `RequiredMinRepFaction`, ' +
        '`RequiredMaxRepFaction`, `RequiredMinRepValue`, `RequiredMaxRepValue`, `ProvidedItemCount`, `SpecialFlags`) VALUES\n' +
        '(1234, 1, 2, 3, 4, 123, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0);'
      );
    });

  });
});
