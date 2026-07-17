document.addEventListener('DOMContentLoaded', () => {
  const elements = {
    newKudoSection: document.getElementById('newKudoSection'),
    mainSection: document.getElementById('mainSection'),
    selectedText: document.getElementById('selectedText'),
    pageInfo: document.getElementById('pageInfo'),
    recipient: document.getElementById('recipient'),
    customRecipient: document.getElementById('customRecipient'),
    addToTeam: document.getElementById('addToTeam'),
    addToTeamLabel: document.getElementById('addToTeamLabel'),
    message: document.getElementById('message'),
    category: document.getElementById('category'),
    saveKudo: document.getElementById('saveKudo'),
    cancelKudo: document.getElementById('cancelKudo'),
    kudosList: document.getElementById('kudosList'),
    teamList: document.getElementById('teamList'),
    newMemberName: document.getElementById('newMemberName'),
    addMemberBtn: document.getElementById('addMemberBtn'),
    exportTeamBtn: document.getElementById('exportTeamBtn'),
    importTeamBtn: document.getElementById('importTeamBtn'),
    importTeamFile: document.getElementById('importTeamFile'),
    exportBtn: document.getElementById('exportBtn'),
    exportAllBtn: document.getElementById('exportAllBtn'),
    importBtn: document.getElementById('importBtn'),
    importFile: document.getElementById('importFile'),
    clearKudosBtn: document.getElementById('clearKudosBtn'),
    dateFrom: document.getElementById('dateFrom'),
    dateTo: document.getElementById('dateTo'),
    applyFilter: document.getElementById('applyFilter'),
    clearFilter: document.getElementById('clearFilter'),
    editModal: document.getElementById('editModal'),
    editDate: document.getElementById('editDate'),
    saveEditBtn: document.getElementById('saveEditBtn'),
    cancelEditBtn: document.getElementById('cancelEditBtn'),
    tabs: document.querySelectorAll('.tab'),
    tabContents: document.querySelectorAll('.tab-content')
  };

  let pendingKudoData = null;
  let allKudos = [];
  let filteredKudos = null;
  let editingKudoId = null;

  init();

  function init() {
    checkPendingKudo();
    loadTeamMembers();
    loadKudos();
    setupEventListeners();
  }

  function setupEventListeners() {
    elements.saveKudo.addEventListener('click', saveKudo);
    elements.cancelKudo.addEventListener('click', cancelKudo);
    elements.addMemberBtn.addEventListener('click', addTeamMember);
    elements.exportTeamBtn.addEventListener('click', exportTeam);
    elements.importTeamBtn.addEventListener('click', () => elements.importTeamFile.click());
    elements.importTeamFile.addEventListener('change', importTeam);
    elements.exportBtn.addEventListener('click', () => exportKudos(false));
    elements.exportAllBtn.addEventListener('click', () => exportKudos(true));
    elements.importBtn.addEventListener('click', () => elements.importFile.click());
    elements.importFile.addEventListener('change', importKudos);
    elements.applyFilter.addEventListener('click', applyDateFilter);
    elements.clearFilter.addEventListener('click', clearDateFilter);
    elements.clearKudosBtn.addEventListener('click', clearAllKudos);
    elements.saveEditBtn.addEventListener('click', saveEditDate);
    elements.cancelEditBtn.addEventListener('click', closeEditModal);

    elements.recipient.addEventListener('change', () => {
      if (elements.recipient.value === 'custom') {
        elements.customRecipient.classList.remove('hidden');
        elements.addToTeamLabel.classList.remove('hidden');
        elements.customRecipient.focus();
      } else {
        elements.customRecipient.classList.add('hidden');
        elements.addToTeamLabel.classList.add('hidden');
        elements.addToTeam.checked = false;
      }
    });

    elements.tabs.forEach(tab => {
      tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });
  }

  function checkPendingKudo() {
    chrome.storage.local.get({ pendingKudo: null }, (result) => {
      if (result.pendingKudo) {
        pendingKudoData = result.pendingKudo;
        showNewKudoForm(result.pendingKudo);
        chrome.storage.local.remove('pendingKudo');
      }
    });
  }

  function showNewKudoForm(data) {
    elements.newKudoSection.classList.remove('hidden');
    elements.mainSection.classList.add('hidden');
    elements.selectedText.textContent = `"${data.text}"`;
    elements.pageInfo.innerHTML = `<a href="${data.url}" target="_blank">${data.title}</a>`;
    elements.message.focus();
  }

  function cancelKudo() {
    pendingKudoData = null;
    elements.newKudoSection.classList.add('hidden');
    elements.mainSection.classList.remove('hidden');
    elements.message.value = '';
    elements.recipient.value = '';
    elements.customRecipient.classList.add('hidden');
    elements.addToTeamLabel.classList.add('hidden');
    elements.addToTeam.checked = false;
  }

  function saveKudo() {
    let recipient = elements.recipient.value;
    if (recipient === 'custom') {
      recipient = elements.customRecipient.value.trim();
    }

    if (!recipient) {
      alert('Por favor, selecione ou digite o nome do destinatário.');
      return;
    }

    const kudo = {
      id: Date.now(),
      recipient: recipient,
      text: pendingKudoData.text,
      message: elements.message.value.trim(),
      category: elements.category.value,
      url: pendingKudoData.url,
      pageTitle: pendingKudoData.title,
      timestamp: pendingKudoData.timestamp,
      createdAt: new Date().toISOString()
    };

    chrome.storage.local.get({ kudos: [], teamMembers: [] }, (result) => {
      const kudos = result.kudos;
      kudos.unshift(kudo);

      const updates = { kudos };

      if (elements.recipient.value === 'custom' && elements.addToTeam.checked) {
        const name = elements.customRecipient.value.trim();
        const exists = result.teamMembers.some(m => m.name.toLowerCase() === name.toLowerCase());
        if (!exists && name) {
          updates.teamMembers = [...result.teamMembers, { name, addedAt: new Date().toISOString() }];
        }
      }

      chrome.storage.local.set(updates, () => {
        cancelKudo();
        loadKudos();
        loadTeamMembers();
        showNotification('Kudo salvo com sucesso!');
      });
    });
  }

  function loadTeamMembers() {
    chrome.storage.local.get({ teamMembers: [] }, (result) => {
      const members = result.teamMembers;
      updateRecipientOptions(members);
      renderTeamList(members);
    });
  }

  function updateRecipientOptions(members) {
    elements.recipient.innerHTML = '<option value="">Selecione...</option>';
    members.forEach(member => {
      const option = document.createElement('option');
      option.value = member.name;
      option.textContent = member.name;
      elements.recipient.appendChild(option);
    });
    const customOption = document.createElement('option');
    customOption.value = 'custom';
    customOption.textContent = 'Outro...';
    elements.recipient.appendChild(customOption);
  }

  function addTeamMember() {
    const name = elements.newMemberName.value.trim();

    if (!name) {
      alert('Por favor, digite o nome do membro.');
      return;
    }

    chrome.storage.local.get({ teamMembers: [] }, (result) => {
      const members = result.teamMembers;
      if (members.find(m => m.name.toLowerCase() === name.toLowerCase())) {
        alert('Este membro já existe na lista.');
        return;
      }

      members.push({ name, addedAt: new Date().toISOString() });
      chrome.storage.local.set({ teamMembers: members }, () => {
        elements.newMemberName.value = '';
        loadTeamMembers();
        showNotification('Membro adicionado com sucesso!');
      });
    });
  }

  function renderTeamList(members) {
    if (members.length === 0) {
      elements.teamList.innerHTML = '<p class="empty-state">Adicione membros da equipe para facilitar o envio de kudos.</p>';
      return;
    }

    elements.teamList.innerHTML = members.map(member => `
      <div class="team-member">
        <div class="member-info">
          <span class="member-name">${member.name}</span>
        </div>
        <button class="btn-icon delete-member" data-name="${member.name}" title="Remover">×</button>
      </div>
    `).join('');

    elements.teamList.querySelectorAll('.delete-member').forEach(btn => {
      btn.addEventListener('click', () => removeTeamMember(btn.dataset.name));
    });
  }

  function removeTeamMember(name) {
    if (!confirm(`Remover ${name} da equipe?`)) return;

    chrome.storage.local.get({ teamMembers: [] }, (result) => {
      const members = result.teamMembers.filter(m => m.name !== name);
      chrome.storage.local.set({ teamMembers: members }, () => {
        loadTeamMembers();
      });
    });
  }

  function exportTeam() {
    chrome.storage.local.get({ teamMembers: [] }, (result) => {
      if (result.teamMembers.length === 0) {
        alert('Nenhum membro para exportar.');
        return;
      }

      const data = {
        exportDate: new Date().toISOString(),
        version: '1.0',
        type: 'team',
        teamMembers: result.teamMembers
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `equipe-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showNotification(`${result.teamMembers.length} membros exportados com sucesso!`);
    });
  }

  function importTeam(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);

        if (!data.teamMembers || !Array.isArray(data.teamMembers)) {
          throw new Error('Formato inválido');
        }

        chrome.storage.local.get({ teamMembers: [] }, (result) => {
          const existingNames = new Set(result.teamMembers.map(m => m.name.toLowerCase()));
          const newMembers = data.teamMembers.filter(m => !existingNames.has(m.name.toLowerCase()));
          const allMembers = [...result.teamMembers, ...newMembers];

          chrome.storage.local.set({ teamMembers: allMembers }, () => {
            loadTeamMembers();
            showNotification(`${newMembers.length} membros importados com sucesso!`);
          });
        });
      } catch (error) {
        alert('Erro ao importar arquivo. Verifique se é um arquivo JSON válido de equipe.');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  }

  function loadKudos() {
    chrome.storage.local.get({ kudos: [] }, (result) => {
      allKudos = result.kudos;
      filteredKudos = null;
      renderKudosList(allKudos);
    });
  }

  function renderKudosList(kudos) {
    if (kudos.length === 0) {
      elements.kudosList.innerHTML = '<p class="empty-state">Nenhum kudo encontrado.</p>';
      return;
    }

    elements.kudosList.innerHTML = kudos.map(kudo => `
      <div class="kudo-card">
        <div class="kudo-header">
          <span class="kudo-recipient">Para: ${kudo.recipient}</span>
          <span class="kudo-category category-${kudo.category}">${getCategoryLabel(kudo.category)}</span>
        </div>
        <div class="kudo-text">"${kudo.text}"</div>
        ${kudo.message ? `<div class="kudo-message">${kudo.message}</div>` : ''}
        <div class="kudo-footer">
          <a href="${kudo.url}" target="_blank" class="kudo-source">${kudo.pageTitle || 'Página'}</a>
          <span class="kudo-date">${formatDate(kudo.createdAt)}</span>
          <button class="btn-icon edit-kudo" data-id="${kudo.id}" title="Editar data">✏️</button>
          <button class="btn-icon delete-kudo" data-id="${kudo.id}" title="Excluir">×</button>
        </div>
      </div>
    `).join('');

    elements.kudosList.querySelectorAll('.delete-kudo').forEach(btn => {
      btn.addEventListener('click', () => deleteKudo(parseInt(btn.dataset.id)));
    });

    elements.kudosList.querySelectorAll('.edit-kudo').forEach(btn => {
      btn.addEventListener('click', () => openEditModal(parseInt(btn.dataset.id)));
    });
  }

  function deleteKudo(id) {
    if (!confirm('Excluir este kudo?')) return;

    chrome.storage.local.get({ kudos: [] }, (result) => {
      const kudos = result.kudos.filter(k => k.id !== id);
      chrome.storage.local.set({ kudos }, () => {
        allKudos = kudos;
        if (filteredKudos) {
          applyDateFilter();
        } else {
          renderKudosList(allKudos);
        }
      });
    });
  }

  function openEditModal(id) {
    const kudo = allKudos.find(k => k.id === id);
    if (!kudo) return;

    editingKudoId = id;
    const date = new Date(kudo.createdAt);
    const localDateTime = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    elements.editDate.value = localDateTime;
    elements.editModal.classList.remove('hidden');
  }

  function closeEditModal() {
    elements.editModal.classList.add('hidden');
    editingKudoId = null;
  }

  function saveEditDate() {
    if (!editingKudoId) return;

    const newDate = elements.editDate.value;
    if (!newDate) {
      alert('Selecione uma data.');
      return;
    }

    const isoDate = new Date(newDate).toISOString();

    chrome.storage.local.get({ kudos: [] }, (result) => {
      const kudos = result.kudos.map(k => {
        if (k.id === editingKudoId) {
          return { ...k, createdAt: isoDate };
        }
        return k;
      });

      chrome.storage.local.set({ kudos }, () => {
        allKudos = kudos;
        closeEditModal();
        if (filteredKudos) {
          applyDateFilter();
        } else {
          renderKudosList(allKudos);
        }
        showNotification('Data atualizada com sucesso!');
      });
    });
  }

  function applyDateFilter() {
    const from = elements.dateFrom.value;
    const to = elements.dateTo.value;

    if (!from && !to) {
      filteredKudos = null;
      renderKudosList(allKudos);
      return;
    }

    filteredKudos = allKudos.filter(kudo => {
      const kudoDate = new Date(kudo.createdAt).toISOString().split('T')[0];
      if (from && kudoDate < from) return false;
      if (to && kudoDate > to) return false;
      return true;
    });

    renderKudosList(filteredKudos);
  }

  function clearDateFilter() {
    elements.dateFrom.value = '';
    elements.dateTo.value = '';
    filteredKudos = null;
    renderKudosList(allKudos);
  }

  function clearAllKudos() {
    if (allKudos.length === 0) {
      alert('Nenhum kudo para limpar.');
      return;
    }

    const confirmed = confirm(`Tem certeza que deseja apagar todos os ${allKudos.length} kudos?\n\nUma cópia de segurança será baixada automaticamente antes de apagar.`);
    
    if (!confirmed) return;

    const data = {
      exportDate: new Date().toISOString(),
      version: '1.0',
      type: 'backup',
      kudos: allKudos
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kudos-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    chrome.storage.local.set({ kudos: [] }, () => {
      allKudos = [];
      filteredKudos = null;
      renderKudosList(allKudos);
      showNotification('Todos os kudos foram apagados.');
    });
  }

  function exportKudos(exportAll) {
    const kudosToExport = exportAll ? allKudos : (filteredKudos || allKudos);

    chrome.storage.local.get({ teamMembers: [] }, (result) => {
      const data = {
        exportDate: new Date().toISOString(),
        version: '1.0',
        filtered: !exportAll,
        dateRange: exportAll ? null : {
          from: elements.dateFrom.value || null,
          to: elements.dateTo.value || null
        },
        kudos: kudosToExport,
        teamMembers: result.teamMembers
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const suffix = exportAll ? 'todos' : 'filtrados';
      a.download = `kudos-${suffix}-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showNotification(`${kudosToExport.length} kudos exportados com sucesso!`);
    });
  }

  function importKudos(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);

        if (!data.kudos || !Array.isArray(data.kudos)) {
          throw new Error('Formato inválido');
        }

        chrome.storage.local.get({ kudos: [], teamMembers: [] }, (result) => {
          const existingIds = new Set(result.kudos.map(k => k.id));
          const newKudos = data.kudos.filter(k => !existingIds.has(k.id));
          const allKudosMerged = [...result.kudos, ...newKudos];

          const existingNames = new Set(result.teamMembers.map(m => m.name));
          const newMembers = (data.teamMembers || []).filter(m => !existingNames.has(m.name));
          const allMembers = [...result.teamMembers, ...newMembers];

          chrome.storage.local.set({
            kudos: allKudosMerged,
            teamMembers: allMembers
          }, () => {
            loadKudos();
            loadTeamMembers();
            showNotification(`${newKudos.length} kudos e ${newMembers.length} membros importados!`);
          });
        });
      } catch (error) {
        alert('Erro ao importar arquivo. Verifique se é um arquivo JSON válido.');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  }

  function switchTab(tabName) {
    elements.tabs.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabName);
    });
    elements.tabContents.forEach(content => {
      content.classList.toggle('active', content.id === `${tabName}Tab`);
    });
  }

  function getCategoryLabel(category) {
    const labels = {
      ajuda: 'Ajuda',
      colaboracao: 'Colaboração',
      inovacao: 'Inovação',
      qualidade: 'Qualidade',
      outro: 'Outro'
    };
    return labels[category] || category;
  }

  function formatDate(isoString) {
    const date = new Date(isoString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  }
});
