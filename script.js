/**
 * TruckFlow - Trucking Logistics Dashboard
 * Complete JavaScript with Partners, Locations, Entry Management, and Edit Functionality
 * Version 2.1 - Fixed and Complete
 */

// ============================================
// CONFIGURATION
// ============================================

const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbxZdBX6-d1oIiq8nUM5HECHOiojHnpyK-ODniCt9amippNE-02Vy9BkvbQrF3ip3rt8-A/exec';

const AppState = {
    currentFilter: 'today',
    customDateRange: { from: null, to: null },
    transactions: [],
    partners: [],
    locations: [],
    usedPartnersToday: [],
    selectedDate: null,
    isLoading: false,
    currentCustomPartnerRow: null,
    currentCustomLocationRow: null,
    currentCustomLocationType: null,
    editingEntry: null
};

// ============================================
// DOCUMENT READY
// ============================================

$(document).ready(function() {
    console.log('🚛 TruckFlow Dashboard Initializing...');
    
    initializeApp();
    setupEventListeners();
    
    console.log('✅ TruckFlow Dashboard Ready');
});

/**
 * Initialize the application
 */
function initializeApp() {
    setDefaultDates();
    setActiveFilter($('#filterToday'), 'today');
    loadDashboardData('today');
}

/**
 * Setup all event listeners
 */
function setupEventListeners() {
    // Modal events
    setupModalEventListeners();
    
    // Filter events
    setupFilterEventListeners();
    
    // Partners/Locations management
    setupManagementEventListeners();
    
    // Entry submission
    setupEntryEventListeners();
    
    // Delete events
    setupDeleteEventListeners();
    
    // Custom partner/location modals
    setupCustomModalEventListeners();
    
    // Edit entry modal
    setupEditEntryEventListeners();
}

// ============================================
// MODAL MANAGEMENT
// ============================================

function setupModalEventListeners() {
    // Open entry modal
    $('#openModalBtn').on('click', function() {
        openEntryModal();
    });
    
    // Close entry modal
    $('#closeModalBtn, #cancelModalBtn').on('click', function() {
        closeEntryModal();
    });
    
    // Close on backdrop click
    $('#modalBackdrop').on('click', function() {
        closeEntryModal();
    });
    
    // Prevent modal content click from closing
    $('#entryModal > div > div').on('click', function(e) {
        e.stopPropagation();
    });
    
    // Date toggle buttons
    $('#dateTodayBtn').on('click', function() {
        setDateToggle('today');
    });
    
    $('#dateSpecificBtn').on('click', function() {
        setDateToggle('specific');
    });
    
    // Specific date change
    $('#entryDate').on('change', function() {
        const selectedDate = $(this).val();
        AppState.selectedDate = selectedDate;
        loadUsedPartnersForDate(selectedDate);
    });
    
    // Add row button
    $('#addRowBtn').on('click', function() {
        addEntryRow();
    });
    
    // Delete row (event delegation)
    $('#modalBody').on('click', '.delete-row-btn', function() {
        deleteEntryRow($(this));
    });
    
    // Partner select change (event delegation)
    $('#modalBody').on('change', '.partner-select', function() {
        handlePartnerChange($(this));
    });
    
    // Location select change (event delegation)
    $('#modalBody').on('change', '.location-select', function() {
        handleLocationChange($(this));
    });
    
    // Escape key to close modals
    $(document).on('keydown', function(e) {
        if (e.key === 'Escape') {
            if (!$('#customPartnerModal').hasClass('hidden')) {
                closeCustomPartnerModal();
            } else if (!$('#customLocationModal').hasClass('hidden')) {
                closeCustomLocationModal();
            } else if (!$('#deleteConfirmModal').hasClass('hidden')) {
                closeDeleteConfirmModal();
            } else if (!$('#deletePartnerModal').hasClass('hidden')) {
                closeDeletePartnerModal();
            } else if (!$('#deleteLocationModal').hasClass('hidden')) {
                closeDeleteLocationModal();
            } else if (!$('#editEntryModal').hasClass('hidden')) {
                closeEditEntryModal();
            } else if (!$('#partnersModal').hasClass('hidden')) {
                closePartnersModal();
            } else if (!$('#locationsModal').hasClass('hidden')) {
                closeLocationsModal();
            } else if (!$('#entryModal').hasClass('hidden')) {
                closeEntryModal();
            }
        }
    });

        // Clear validation error when user changes a field
    $('#modalBody').on('change input', 'select, input', function() {
        $(this).removeClass('ring-2 ring-rose-500 border-rose-500');
    });
}

/**
 * Open entry modal and load data
 */
function openEntryModal() {
    const $modal = $('#entryModal');
    const $loading = $('#modalLoading');
    const $content = $('#modalContent');
    
    // Show modal
    $modal.removeClass('hidden');
    $('body').addClass('overflow-hidden');
    
    // Show loading, hide content
    $loading.removeClass('hidden');
    $content.addClass('hidden');
    
    // Set today's date display
    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    $('#todayDateDisplay').text(today.toLocaleDateString('en-US', options));
    
    // Reset date toggle to Today
    setDateToggle('today');
    AppState.selectedDate = formatDate(today);
    
    // Load partners and locations
    loadPartnersAndLocations()
        .then(() => {
            return loadUsedPartnersForDate(AppState.selectedDate);
        })
        .then(() => {
            // Clear existing rows and add one fresh row
            $('#modalBody').empty();
            addEntryRow();
            
            // Hide loading, show content
            $loading.addClass('hidden');
            $content.removeClass('hidden');
        })
        .catch(error => {
            console.error('Error loading modal data:', error);
            showNotification('Failed to load data. Please try again.', 'error');
            closeEntryModal();
        });
}

/**
 * Close entry modal
 */
function closeEntryModal() {
    $('#entryModal').addClass('hidden');
    $('body').removeClass('overflow-hidden');
    $('#modalBody').empty();
}

/**
 * Set date toggle state
 */
function setDateToggle(type) {
    if (type === 'today') {
        $('#dateTodayBtn')
            .addClass('bg-indigo-600 text-white')
            .removeClass('text-slate-600 hover:bg-slate-50');
        $('#dateSpecificBtn')
            .removeClass('bg-indigo-600 text-white')
            .addClass('text-slate-600 hover:bg-slate-50');
        $('#specificDateContainer').addClass('hidden');
        $('#todayDateDisplay').removeClass('hidden');
        
        AppState.selectedDate = formatDate(new Date());
        loadUsedPartnersForDate(AppState.selectedDate);
    } else {
        $('#dateSpecificBtn')
            .addClass('bg-indigo-600 text-white')
            .removeClass('text-slate-600 hover:bg-slate-50');
        $('#dateTodayBtn')
            .removeClass('bg-indigo-600 text-white')
            .addClass('text-slate-600 hover:bg-slate-50');
        $('#specificDateContainer').removeClass('hidden');
        $('#todayDateDisplay').addClass('hidden');
        
        // Set default date
        $('#entryDate').val(formatDate(new Date()));
        AppState.selectedDate = formatDate(new Date());
    }
}

// ============================================
// ENTRY ROW MANAGEMENT
// ============================================

/**
 * Add a new entry row
 */
function addEntryRow() {
    const $template = $('#entryRowTemplate');
    if ($template.length === 0) {
        console.error('Entry row template not found');
        return;
    }
    
    const $newRow = $($template.html());
    
    // Populate partner select
    populatePartnerSelect($newRow.find('.partner-select'));
    
    // Populate location selects (initially no exclusions)
    populateLocationSelect($newRow.find('.from-select'), null, null);
    populateLocationSelect($newRow.find('.to-select'), null, null);
    
    // Append row
    $('#modalBody').append($newRow);
    
    // Focus on partner select
    $newRow.find('.partner-select').focus();
}

/**
 * Delete entry row
 */
function deleteEntryRow($button) {
    const $row = $button.closest('.entry-row');
    const rowCount = $('#modalBody .entry-row').length;
    
    if (rowCount <= 1) {
        // Clear inputs instead of deleting
        $row.find('input').val('');
        $row.find('select').prop('selectedIndex', 0);
        showNotification('At least one entry row is required', 'warning');
        return;
    }
    
    // Get the partner value to remove from used list
    const partnerValue = $row.find('.partner-select').val();
    if (partnerValue && !partnerValue.startsWith('__')) {
        const index = AppState.usedPartnersToday.indexOf(partnerValue);
        if (index > -1) {
            AppState.usedPartnersToday.splice(index, 1);
        }
    }
    
    $row.fadeOut(200, function() {
        $(this).remove();
        updateAllPartnerSelects();
    });
}

/**
 * Populate partner select dropdown
 */
function populatePartnerSelect($select, keepValue = null) {
    $select.empty();
    $select.append('<option value="">Select partner...</option>');
    
    // Add partners (excluding used ones, but keep current value)
    AppState.partners.forEach(partner => {
        const isUsed = AppState.usedPartnersToday.includes(partner);
        const isUsedInCurrentRows = isPartnerUsedInCurrentRows(partner);
        
        // Include if: not used elsewhere, OR it's the current value of this select
        if ((!isUsed && !isUsedInCurrentRows) || partner === keepValue) {
            $select.append(`<option value="${escapeHtml(partner)}">${escapeHtml(partner)}</option>`);
        }
    });
    
    // Add custom option
    $select.append('<option value="__custom__">+ Add Custom Partner...</option>');
}

/**
 * Populate location select dropdown
 */
function populateLocationSelect($select, keepValue = null, excludeValue = null) {
    const currentValue = keepValue || $select.val();
    
    $select.empty();
    $select.append('<option value="">Select location...</option>');
    
    AppState.locations.forEach(location => {
        // Skip the excluded value (selected in the other dropdown)
        if (excludeValue && location === excludeValue) {
            return;
        }
        $select.append(`<option value="${escapeHtml(location)}">${escapeHtml(location)}</option>`);
    });
    
    // Add custom option
    $select.append('<option value="__custom__">+ Add Custom Location...</option>');
    
    // Restore value if it exists
    if (currentValue && currentValue !== '__custom__') {
        $select.val(currentValue);
    }
}

/**
 * Check if partner is already used in current entry rows
 */
function isPartnerUsedInCurrentRows(partner) {
    let isUsed = false;
    $('#modalBody .partner-select').each(function() {
        if ($(this).val() === partner) {
            isUsed = true;
            return false;
        }
    });
    return isUsed;
}

/**
 * Update all partner selects (after adding/removing)
 */
function updateAllPartnerSelects() {
    $('#modalBody .partner-select').each(function() {
        const $this = $(this);
        const currentValue = $this.val();
        populatePartnerSelect($this, currentValue); // Pass current value to keep it
        if (currentValue && currentValue !== '__custom__') {
            $this.val(currentValue);
        }
    });
}

function updateAllLocationSelects() {
    $('#modalBody .entry-row').each(function() {
        const $row = $(this);
        const $fromSelect = $row.find('.from-select');
        const $toSelect = $row.find('.to-select');
        
        const fromValue = $fromSelect.val();
        const toValue = $toSelect.val();
        
        // Populate From select, excluding what's selected in To
        populateLocationSelect($fromSelect, fromValue, toValue);
        
        // Populate To select, excluding what's selected in From
        populateLocationSelect($toSelect, toValue, fromValue);
    });
}

/**
 * Handle partner select change
 */
function handlePartnerChange($select) {
    const value = $select.val();
    
    if (value === '__custom__') {
        // Store reference to the row
        AppState.currentCustomPartnerRow = $select.closest('.entry-row');
        $select.val('');
        openCustomPartnerModal();
    } else {
        // Update other dropdowns
        updateAllPartnerSelects();
    }
}

/**
 * Handle location select change
 */
function handleLocationChange($select) {
    const value = $select.val();
    const $row = $select.closest('.entry-row');
    const isFromSelect = $select.hasClass('from-select');
    
    if (value === '__custom__') {
        AppState.currentCustomLocationRow = $row;
        AppState.currentCustomLocationType = isFromSelect ? 'from' : 'to';
        $select.val('');
        openCustomLocationModal();
        return;
    }
    
    // Update the OTHER location select in the same row to exclude this value
    if (isFromSelect) {
        // User changed "From", update "To" dropdown
        const $toSelect = $row.find('.to-select');
        const toValue = $toSelect.val();
        populateLocationSelect($toSelect, toValue, value);
    } else {
        // User changed "To", update "From" dropdown
        const $fromSelect = $row.find('.from-select');
        const fromValue = $fromSelect.val();
        populateLocationSelect($fromSelect, fromValue, value);
    }
}

// ============================================
// CUSTOM PARTNER/LOCATION MODALS
// ============================================

function setupCustomModalEventListeners() {
    // Custom Partner Modal
    $('#cancelCustomPartner').on('click', closeCustomPartnerModal);
    $('#confirmCustomPartner').on('click', confirmCustomPartner);
    
    // Custom Location Modal
    $('#cancelCustomLocation').on('click', closeCustomLocationModal);
    $('#confirmCustomLocation').on('click', confirmCustomLocation);
    
    // Enter key in inputs
    $('#customPartnerName').on('keypress', function(e) {
        if (e.key === 'Enter') confirmCustomPartner();
    });
    
    $('#customLocationName').on('keypress', function(e) {
        if (e.key === 'Enter') confirmCustomLocation();
    });
}

function openCustomPartnerModal() {
    $('#customPartnerModal').removeClass('hidden');
    $('#customPartnerName').val('').focus();
    $('#savePartnerPermanent').prop('checked', true);
}

function closeCustomPartnerModal() {
    $('#customPartnerModal').addClass('hidden');
    $('#customPartnerName').val('');
    AppState.currentCustomPartnerRow = null;
}

function confirmCustomPartner() {
    const name = $('#customPartnerName').val().trim();
    const savePermanent = $('#savePartnerPermanent').is(':checked');
    
    if (!name) {
        showNotification('Please enter a partner name', 'error');
        return;
    }
    
    // Check if already exists
    if (AppState.partners.includes(name)) {
        showNotification('Partner already exists. Selecting it now.', 'info');
        applyCustomPartner(name);
        closeCustomPartnerModal();
        return;
    }
    
    // IMPORTANT: Save the row reference BEFORE any async operation or modal close
    const savedRow = AppState.currentCustomPartnerRow;
    
    if (savePermanent) {
        // Save to sheet
        savePartnerToSheet(name)
            .then((result) => {
                if (result.status === 'success' || result.status === 'exists') {
                    // Add to AppState
                    if (!AppState.partners.includes(name)) {
                        AppState.partners.push(name);
                        AppState.partners.sort();
                    }
                    // Apply using saved reference
                    applyCustomPartnerToRow(name, savedRow);
                    showNotification('Partner added successfully', 'success');
                } else {
                    throw new Error(result.message || 'Failed to save');
                }
            })
            .catch(error => {
                console.error('Error saving partner:', error);
                // Still add locally for this session
                if (!AppState.partners.includes(name)) {
                    AppState.partners.push(name);
                    AppState.partners.sort();
                }
                applyCustomPartnerToRow(name, savedRow);
                showNotification('Partner added for this session', 'warning');
            });
    } else {
        // Just use for this entry (add temporarily to AppState)
        if (!AppState.partners.includes(name)) {
            AppState.partners.push(name);
            AppState.partners.sort();
        }
        applyCustomPartnerToRow(name, savedRow);
        showNotification('Partner added for this entry', 'info');
    }
    
    // Close modal immediately (we already saved the row reference)
    closeCustomPartnerModal();
}

function applyCustomPartner(name) {
    // Add to AppState if not already there
    if (!AppState.partners.includes(name)) {
        AppState.partners.push(name);
        AppState.partners.sort();
    }
    
    // Refresh all partner selects
    updateAllPartnerSelects();
    
    // Set value on current row if reference exists
    if (AppState.currentCustomPartnerRow && AppState.currentCustomPartnerRow.length) {
        AppState.currentCustomPartnerRow.find('.partner-select').val(name);
    }
}

function applyCustomPartnerToRow(name, $row) {
    // Refresh all partner selects with updated list
    updateAllPartnerSelects();
    
    // Set the value on the specific row's select
    if ($row && $row.length) {
        $row.find('.partner-select').val(name);
    }
}

function openCustomLocationModal() {
    $('#customLocationModal').removeClass('hidden');
    $('#customLocationName').val('').focus();
    $('#saveLocationPermanent').prop('checked', true);
}

function closeCustomLocationModal() {
    $('#customLocationModal').addClass('hidden');
    $('#customLocationName').val('');
    AppState.currentCustomLocationRow = null;
    AppState.currentCustomLocationType = null;
}

function confirmCustomLocation() {
    const name = $('#customLocationName').val().trim();
    const savePermanent = $('#saveLocationPermanent').is(':checked');
    
    if (!name) {
        showNotification('Please enter a location name', 'error');
        return;
    }
    
    // Check if already exists
    if (AppState.locations.includes(name)) {
        showNotification('Location already exists. Selecting it now.', 'info');
        applyCustomLocation(name);
        closeCustomLocationModal();
        return;
    }
    
    // IMPORTANT: Save references BEFORE any async operation or modal close
    const savedRow = AppState.currentCustomLocationRow;
    const savedType = AppState.currentCustomLocationType;
    
    if (savePermanent) {
        saveLocationToSheet(name)
            .then((result) => {
                if (result.status === 'success' || result.status === 'exists') {
                    // Add to AppState
                    if (!AppState.locations.includes(name)) {
                        AppState.locations.push(name);
                        AppState.locations.sort();
                    }
                    // Apply using saved references
                    applyCustomLocationToRow(name, savedRow, savedType);
                    showNotification('Location added successfully', 'success');
                } else {
                    throw new Error(result.message || 'Failed to save');
                }
            })
            .catch(error => {
                console.error('Error saving location:', error);
                // Still add locally for this session
                if (!AppState.locations.includes(name)) {
                    AppState.locations.push(name);
                    AppState.locations.sort();
                }
                applyCustomLocationToRow(name, savedRow, savedType);
                showNotification('Location added for this session', 'warning');
            });
    } else {
        // Just use for this entry (add temporarily to AppState)
        if (!AppState.locations.includes(name)) {
            AppState.locations.push(name);
            AppState.locations.sort();
        }
        applyCustomLocationToRow(name, savedRow, savedType);
        showNotification('Location added for this entry', 'info');
    }
    
    // Close modal immediately (we already saved the references)
    closeCustomLocationModal();
}

function applyCustomLocationToRow(name, $row, locationType) {
    // Refresh all location selects with updated list
    updateAllLocationSelects();
    
    // Set the value on the specific row's select
    if ($row && $row.length && locationType) {
        const isFrom = locationType === 'from';
        const $targetSelect = $row.find(isFrom ? '.from-select' : '.to-select');
        const $otherSelect = $row.find(isFrom ? '.to-select' : '.from-select');
        
        // Set value on target select
        $targetSelect.val(name);
        
        // Update the other select to exclude this new value
        const otherValue = $otherSelect.val();
        populateLocationSelect($otherSelect, otherValue, name);
    }
}

function applyCustomLocation(name) {
    // Add to AppState if not already there
    if (!AppState.locations.includes(name)) {
        AppState.locations.push(name);
        AppState.locations.sort();
    }
    
    // Refresh all location selects
    updateAllLocationSelects();
    
    // Set value on current row if references exist
    if (AppState.currentCustomLocationRow && AppState.currentCustomLocationRow.length && AppState.currentCustomLocationType) {
        const $row = AppState.currentCustomLocationRow;
        const isFrom = AppState.currentCustomLocationType === 'from';
        const $targetSelect = $row.find(isFrom ? '.from-select' : '.to-select');
        const $otherSelect = $row.find(isFrom ? '.to-select' : '.from-select');
        
        // Set the value
        $targetSelect.val(name);
        
        // Update other select to exclude this value
        const otherValue = $otherSelect.val();
        populateLocationSelect($otherSelect, otherValue, name);
    }
}

// ============================================
// PARTNERS & LOCATIONS MANAGEMENT MODALS
// ============================================

function setupManagementEventListeners() {
    // Open Partners Modal
    $('#openPartnersBtn').on('click', openPartnersModal);
    $('#closePartnersModal').on('click', closePartnersModal);
    
    // Open Locations Modal
    $('#openLocationsBtn').on('click', openLocationsModal);
    $('#closeLocationsModal').on('click', closeLocationsModal);
    
    // Add Partner
    $('#addPartnerBtn').on('click', addNewPartner);
    $('#newPartnerInput').on('keypress', function(e) {
        if (e.key === 'Enter') addNewPartner();
    });
    
    // Add Location
    $('#addLocationBtn').on('click', addNewLocation);
    $('#newLocationInput').on('keypress', function(e) {
        if (e.key === 'Enter') addNewLocation();
    });
    
    // Delete Partner (event delegation)
    $('#partnersList').on('click', '.delete-partner-btn', function() {
        const name = $(this).data('name');
        openDeletePartnerModal(name);
    });
    
    // Delete Location (event delegation)
    $('#locationsList').on('click', '.delete-location-btn', function() {
        const name = $(this).data('name');
        openDeleteLocationModal(name);
    });
    
    // Delete Partner Confirmation
    $('#cancelDeletePartner').on('click', closeDeletePartnerModal);
    $('#confirmDeletePartner').on('click', confirmDeletePartner);
    
    // Delete Location Confirmation
    $('#cancelDeleteLocation').on('click', closeDeleteLocationModal);
    $('#confirmDeleteLocation').on('click', confirmDeleteLocation);
}

function openPartnersModal() {
    $('#partnersModal').removeClass('hidden');
    loadPartnersList();
}

function closePartnersModal() {
    $('#partnersModal').addClass('hidden');
}

function loadPartnersList() {
    const $list = $('#partnersList');
    const $loading = $('#partnersListLoading');
    const $empty = $('#partnersEmpty');
    
    $list.addClass('hidden').empty();
    $loading.removeClass('hidden');
    $empty.addClass('hidden');
    
    fetchPartners()
        .then(partners => {
            $loading.addClass('hidden');
            
            if (partners.length === 0) {
                $empty.removeClass('hidden');
                $('#partnersCount').text('0 partners');
                return;
            }
            
            partners.forEach(partner => {
                $list.append(`
                    <div class="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                                <span class="text-xs font-bold text-indigo-600">${escapeHtml(getInitials(partner))}</span>
                            </div>
                            <span class="font-medium text-slate-700">${escapeHtml(partner)}</span>
                        </div>
                        <button class="delete-partner-btn p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors" data-name="${escapeHtml(partner)}">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                        </button>
                    </div>
                `);
            });
            
            $list.removeClass('hidden');
            $('#partnersCount').text(`${partners.length} partner${partners.length !== 1 ? 's' : ''}`);
        })
        .catch(error => {
            $loading.addClass('hidden');
            showNotification('Failed to load partners', 'error');
        });
}

function addNewPartner() {
    const name = $('#newPartnerInput').val().trim();
    
    if (!name) {
        showNotification('Please enter a partner name', 'error');
        return;
    }
    
    const $btn = $('#addPartnerBtn');
    $btn.prop('disabled', true).text('Adding...');
    
    savePartnerToSheet(name)
        .then(result => {
            if (result.status === 'exists') {
                showNotification('Partner already exists', 'warning');
            } else {
                AppState.partners.push(name);
                AppState.partners.sort();
                showNotification('Partner added successfully', 'success');
                $('#newPartnerInput').val('');
                loadPartnersList();
            }
        })
        .catch(error => {
            showNotification('Failed to add partner', 'error');
        })
        .finally(() => {
            $btn.prop('disabled', false).text('Add Partner');
        });
}

function openDeletePartnerModal(name) {
    $('#deletePartnerValue').val(name);
    $('#deletePartnerName').text(`Are you sure you want to delete "${name}"?`);
    $('#deletePartnerModal').removeClass('hidden');
}

function closeDeletePartnerModal() {
    $('#deletePartnerModal').addClass('hidden');
    $('#deletePartnerValue').val('');
}

function confirmDeletePartner() {
    const name = $('#deletePartnerValue').val();
    
    const $btn = $('#confirmDeletePartner');
    $btn.prop('disabled', true).text('Deleting...');
    
    deletePartnerFromSheet(name)
        .then(() => {
            const index = AppState.partners.indexOf(name);
            if (index > -1) {
                AppState.partners.splice(index, 1);
            }
            showNotification('Partner deleted successfully', 'success');
            closeDeletePartnerModal();
            loadPartnersList();
        })
        .catch(error => {
            showNotification('Failed to delete partner', 'error');
        })
        .finally(() => {
            $btn.prop('disabled', false).text('Delete Partner');
        });
}

function openLocationsModal() {
    $('#locationsModal').removeClass('hidden');
    loadLocationsList();
}

function closeLocationsModal() {
    $('#locationsModal').addClass('hidden');
}

function loadLocationsList() {
    const $list = $('#locationsList');
    const $loading = $('#locationsListLoading');
    const $empty = $('#locationsEmpty');
    
    $list.addClass('hidden').empty();
    $loading.removeClass('hidden');
    $empty.addClass('hidden');
    
    fetchLocations()
        .then(locations => {
            $loading.addClass('hidden');
            
            if (locations.length === 0) {
                $empty.removeClass('hidden');
                $('#locationsCount').text('0 locations');
                return;
            }
            
            locations.forEach(location => {
                $list.append(`
                    <div class="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                                <svg class="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                                </svg>
                            </div>
                            <span class="font-medium text-slate-700">${escapeHtml(location)}</span>
                        </div>
                        <button class="delete-location-btn p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors" data-name="${escapeHtml(location)}">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                        </button>
                    </div>
                `);
            });
            
            $list.removeClass('hidden');
            $('#locationsCount').text(`${locations.length} location${locations.length !== 1 ? 's' : ''}`);
        })
        .catch(error => {
            $loading.addClass('hidden');
            showNotification('Failed to load locations', 'error');
        });
}

function addNewLocation() {
    const name = $('#newLocationInput').val().trim();
    
    if (!name) {
        showNotification('Please enter a location name', 'error');
        return;
    }
    
    const $btn = $('#addLocationBtn');
    $btn.prop('disabled', true).text('Adding...');
    
    saveLocationToSheet(name)
        .then(result => {
            if (result.status === 'exists') {
                showNotification('Location already exists', 'warning');
            } else {
                AppState.locations.push(name);
                AppState.locations.sort();
                showNotification('Location added successfully', 'success');
                $('#newLocationInput').val('');
                loadLocationsList();
            }
        })
        .catch(error => {
            showNotification('Failed to add location', 'error');
        })
        .finally(() => {
            $btn.prop('disabled', false).text('Add Location');
        });
}

function openDeleteLocationModal(name) {
    $('#deleteLocationValue').val(name);
    $('#deleteLocationName').text(`Are you sure you want to delete "${name}"?`);
    $('#deleteLocationModal').removeClass('hidden');
}

function closeDeleteLocationModal() {
    $('#deleteLocationModal').addClass('hidden');
    $('#deleteLocationValue').val('');
}

function confirmDeleteLocation() {
    const name = $('#deleteLocationValue').val();
    
    const $btn = $('#confirmDeleteLocation');
    $btn.prop('disabled', true).text('Deleting...');
    
    deleteLocationFromSheet(name)
        .then(() => {
            const index = AppState.locations.indexOf(name);
            if (index > -1) {
                AppState.locations.splice(index, 1);
            }
            showNotification('Location deleted successfully', 'success');
            closeDeleteLocationModal();
            loadLocationsList();
        })
        .catch(error => {
            showNotification('Failed to delete location', 'error');
        })
        .finally(() => {
            $btn.prop('disabled', false).text('Delete Location');
        });
}

// ============================================
// ENTRY SUBMISSION
// ============================================

function setupEntryEventListeners() {
    $('#saveEntries').on('click', saveEntries);
}

/**
 * Validate all entry rows before saving
 * @returns {Object} { isValid: boolean, message: string, firstInvalidField: jQuery|null }
 */
function validateEntries() {
    let isValid = true;
    let message = '';
    let firstInvalidField = null;
    
    const $rows = $('#modalBody .entry-row');
    
    if ($rows.length === 0) {
        return {
            isValid: false,
            message: 'Please add at least one entry',
            firstInvalidField: null
        };
    }
    
    // Clear any previous validation highlights
    $rows.find('select, input').removeClass('ring-2 ring-rose-500 border-rose-500');
    
    $rows.each(function(index) {
        const $row = $(this);
        const rowNum = index + 1;
        
        // Get field values
        const partner = $row.find('[name="entryPartner"]').val();
        const from = $row.find('[name="entryFrom"]').val();
        const to = $row.find('[name="entryTo"]').val();
        const amount = $row.find('[name="entryAmount"]').val();
        const trucks = $row.find('[name="entryTrucks"]').val();
        
        // Validate Partner
        if (!partner || partner === '' || partner === '__custom__') {
            if (isValid) {
                isValid = false;
                message = `Row ${rowNum}: Please select a partner`;
                firstInvalidField = $row.find('[name="entryPartner"]');
            }
            $row.find('[name="entryPartner"]').addClass('ring-2 ring-rose-500 border-rose-500');
        }
        
        // Validate From Location
        if (!from || from === '' || from === '__custom__') {
            if (isValid) {
                isValid = false;
                message = `Row ${rowNum}: Please select a "From" location`;
                firstInvalidField = $row.find('[name="entryFrom"]');
            }
            $row.find('[name="entryFrom"]').addClass('ring-2 ring-rose-500 border-rose-500');
        }
        
        // Validate To Location
        if (!to || to === '' || to === '__custom__') {
            if (isValid) {
                isValid = false;
                message = `Row ${rowNum}: Please select a "To" location`;
                firstInvalidField = $row.find('[name="entryTo"]');
            }
            $row.find('[name="entryTo"]').addClass('ring-2 ring-rose-500 border-rose-500');
        }
        
        // Validate From and To are different
        if (from && to && from === to) {
            if (isValid) {
                isValid = false;
                message = `Row ${rowNum}: "From" and "To" locations cannot be the same`;
                firstInvalidField = $row.find('[name="entryTo"]');
            }
            $row.find('[name="entryFrom"], [name="entryTo"]').addClass('ring-2 ring-rose-500 border-rose-500');
        }
        
        // Validate Amount (must be a positive number)
        if (!amount || amount === '' || parseFloat(amount) <= 0) {
            if (isValid) {
                isValid = false;
                message = `Row ${rowNum}: Please enter a valid amount greater than 0`;
                firstInvalidField = $row.find('[name="entryAmount"]');
            }
            $row.find('[name="entryAmount"]').addClass('ring-2 ring-rose-500 border-rose-500');
        }
        
        // Validate Trucks (must be a positive number)
        if (!trucks || trucks === '' || parseInt(trucks) <= 0) {
            if (isValid) {
                isValid = false;
                message = `Row ${rowNum}: Please enter a valid truck count greater than 0`;
                firstInvalidField = $row.find('[name="entryTrucks"]');
            }
            $row.find('[name="entryTrucks"]').addClass('ring-2 ring-rose-500 border-rose-500');
        }
    });
    
    return {
        isValid: isValid,
        message: message,
        firstInvalidField: firstInvalidField
    };
}

function saveEntries() {
    // Validate entries first
    const validation = validateEntries();
    
    if (!validation.isValid) {
        showNotification(validation.message, 'error');
        
        // Focus the first invalid field
        if (validation.firstInvalidField) {
            validation.firstInvalidField.focus();
            
            // Remove all highlights after 3 seconds
            setTimeout(() => {
                $('#modalBody .entry-row').find('select, input').removeClass('ring-2 ring-rose-500 border-rose-500');
            }, 3000);
        }
        return;
    }
    
    const entries = collectEntryData();
    
    if (entries.length === 0) {
        showNotification('Please fill in at least one complete entry', 'error');
        return;
    }
    
    const $btn = $('#saveEntries');
    const originalHtml = $btn.html();
    
    $btn.prop('disabled', true).html(`
        <svg class="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
        </svg>
        Saving...
    `);
    
    submitEntries(entries)
        .then(result => {
            if (result.status === 'success' || result.status === 'partial') {
                showNotification(`${result.savedCount} entries saved successfully!`, 'success');
                closeEntryModal();
                refreshDashboardData();
            } else {
                throw new Error(result.message || 'Failed to save entries');
            }
        })
        .catch(error => {
            console.error('Save error:', error);
            showNotification('Failed to save entries. Please try again.', 'error');
        })
        .finally(() => {
            $btn.prop('disabled', false).html(originalHtml);
        });
}

function collectEntryData() {
    const entries = [];
    const date = AppState.selectedDate || formatDate(new Date());
    
    $('#modalBody .entry-row').each(function() {
        const $row = $(this);
        
        const partner = $row.find('[name="entryPartner"]').val();
        const from = $row.find('[name="entryFrom"]').val();
        const to = $row.find('[name="entryTo"]').val();
        const amount = parseFloat($row.find('[name="entryAmount"]').val()) || 0;
        const truckCount = parseInt($row.find('[name="entryTrucks"]').val()) || 0;
        const status = $row.find('[name="entryStatus"]').val();
        
        // Only include if partner is selected
        if (partner && partner !== '__custom__') {
            entries.push({
                date: date,
                partner: partner,
                from: from || '',
                to: to || '',
                amount: amount,
                truckCount: truckCount,
                status: status || 'Paid'
            });
        }
    });
    
    return entries;
}

// ============================================
// EDIT ENTRY MODAL
// ============================================

function setupEditEntryEventListeners() {
    // Open edit modal (event delegation)
    $('#transactionsBody').on('click', '.edit-entry-btn', function() {
        const rowNumber = $(this).data('row');
        const rowId = $(this).data('rowid');
        openEditEntryModal(rowNumber, rowId);
    });
    
    // Close edit modal
    $('#closeEditModal, #cancelEditBtn').on('click', closeEditEntryModal);
    
    // Save edit
    $('#saveEditBtn').on('click', saveEditEntry);
}

function openEditEntryModal(rowNumber, rowId) {
    const $modal = $('#editEntryModal');
    const $loading = $('#editModalLoading');
    const $content = $('#editModalContent');
    
    // Show modal
    $modal.removeClass('hidden');
    $('body').addClass('overflow-hidden');
    
    // Show loading
    $loading.removeClass('hidden');
    $content.addClass('hidden');
    
    // Find the entry in transactions
    const entry = AppState.transactions.find(tx => 
        tx.rowNumber == rowNumber || tx.rowId === rowId
    );
    
    if (!entry) {
        showNotification('Entry not found', 'error');
        closeEditEntryModal();
        return;
    }
    
    AppState.editingEntry = entry;
    
    // Load partners and locations if needed
    loadPartnersAndLocations()
        .then(() => {
            // Populate form
            $('#editRowNumber').val(rowNumber || rowId);
            $('#editDate').val(entry.date);
            
            // Populate partner select
            const $partnerSelect = $('#editPartner');
            $partnerSelect.empty().append('<option value="">Select partner...</option>');
            AppState.partners.forEach(partner => {
                const selected = partner === entry.partner ? 'selected' : '';
                $partnerSelect.append(`<option value="${escapeHtml(partner)}" ${selected}>${escapeHtml(partner)}</option>`);
            });
            // If partner not in list, add it
            if (entry.partner && !AppState.partners.includes(entry.partner)) {
                $partnerSelect.append(`<option value="${escapeHtml(entry.partner)}" selected>${escapeHtml(entry.partner)}</option>`);
            }
            $partnerSelect.val(entry.partner);
            
            // Populate location selects
            populateEditLocationSelect($('#editFrom'), entry.from);
            populateEditLocationSelect($('#editTo'), entry.to);
            
            // Set other values
            $('#editAmount').val(entry.amount);
            $('#editTrucks').val(entry.truckCount);
            $('#editStatus').val(entry.status);
            
            // Hide loading, show content
            $loading.addClass('hidden');
            $content.removeClass('hidden');
        })
        .catch(error => {
            console.error('Error loading edit modal:', error);
            showNotification('Failed to load entry data', 'error');
            closeEditEntryModal();
        });
}

function populateEditLocationSelect($select, currentValue) {
    $select.empty().append('<option value="">Select location...</option>');
    
    AppState.locations.forEach(location => {
        const selected = location === currentValue ? 'selected' : '';
        $select.append(`<option value="${escapeHtml(location)}" ${selected}>${escapeHtml(location)}</option>`);
    });
    
    // If current value not in list, add it
    if (currentValue && !AppState.locations.includes(currentValue)) {
        $select.append(`<option value="${escapeHtml(currentValue)}" selected>${escapeHtml(currentValue)}</option>`);
    }
    
    $select.val(currentValue);
}

function closeEditEntryModal() {
    $('#editEntryModal').addClass('hidden');
    $('body').removeClass('overflow-hidden');
    AppState.editingEntry = null;
}

function saveEditEntry() {
    const rowNumber = $('#editRowNumber').val();
    const date = $('#editDate').val();
    const partner = $('#editPartner').val();
    const from = $('#editFrom').val();
    const to = $('#editTo').val();
    const amount = parseFloat($('#editAmount').val()) || 0;
    const truckCount = parseInt($('#editTrucks').val()) || 0;
    const status = $('#editStatus').val();
    
    if (!partner) {
        showNotification('Please select a partner', 'error');
        return;
    }
    
    if (!date) {
        showNotification('Please select a date', 'error');
        return;
    }
    
    const $btn = $('#saveEditBtn');
    const originalHtml = $btn.html();
    
    $btn.prop('disabled', true).html(`
        <svg class="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
        </svg>
        Updating...
    `);
    
    // Update entry via API
    updateEntry(rowNumber, {
        date: date,
        partner: partner,
        from: from,
        to: to,
        amount: amount,
        truckCount: truckCount,
        status: status
    })
        .then(result => {
            if (result.status === 'success') {
                showNotification('Entry updated successfully!', 'success');
                closeEditEntryModal();
                refreshDashboardData();
            } else {
                throw new Error(result.message || 'Failed to update entry');
            }
        })
        .catch(error => {
            console.error('Update error:', error);
            showNotification('Failed to update entry. Please try again.', 'error');
        })
        .finally(() => {
            $btn.prop('disabled', false).html(originalHtml);
        });
}

function updateEntry(rowNumber, entryData) {
    return fetch(WEB_APP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
            action: 'updateEntry',
            rowNumber: rowNumber,
            entry: entryData
        })
    }).then(response => response.json());
}

// ============================================
// DELETE ENTRY
// ============================================

function setupDeleteEventListeners() {
    // Delete entry from table (event delegation)
    $('#transactionsBody').on('click', '.delete-entry-btn', function() {
        const rowNumber = $(this).data('row');
        const rowId = $(this).data('rowid');
        openDeleteConfirmModal(rowNumber, rowId);
    });
    
    // Confirm/Cancel delete
    $('#cancelDelete').on('click', closeDeleteConfirmModal);
    $('#confirmDelete').on('click', confirmDeleteEntry);
}

function openDeleteConfirmModal(rowNumber, rowId) {
    $('#deleteRowNumber').val(rowNumber || rowId);
    $('#deleteConfirmModal').removeClass('hidden');
}

function closeDeleteConfirmModal() {
    $('#deleteConfirmModal').addClass('hidden');
    $('#deleteRowNumber').val('');
}

function confirmDeleteEntry() {
    const identifier = $('#deleteRowNumber').val();
    
    const $btn = $('#confirmDelete');
    $btn.prop('disabled', true).text('Deleting...');
    
    deleteEntryFromSheet(identifier)
        .then(result => {
            if (result.status === 'success') {
                showNotification('Entry deleted successfully', 'success');
                closeDeleteConfirmModal();
                refreshDashboardData();
            } else {
                throw new Error(result.message || 'Failed to delete');
            }
        })
        .catch(error => {
            console.error('Delete error:', error);
            showNotification('Failed to delete entry', 'error');
        })
        .finally(() => {
            $btn.prop('disabled', false).text('Delete Entry');
        });
}

// ============================================
// FILTER MANAGEMENT
// ============================================

function setupFilterEventListeners() {
    $('#filterToday').on('click', function() {
        setActiveFilter($(this), 'today');
        applyDateFilter('today');
    });
    
    $('#filterWeek').on('click', function() {
        setActiveFilter($(this), 'week');
        applyDateFilter('week');
    });
    
    $('#filterMonth').on('click', function() {
        setActiveFilter($(this), 'month');
        applyDateFilter('month');
    });
    
    $('#customRangeBtn').on('click', toggleCustomRangeFields);
    
    $('#applyDateRange').on('click', applyCustomDateRange);
    
    $('#refreshBtn').on('click', function() {
        const $icon = $('#refreshIcon');
        $icon.addClass('animate-spin');
        refreshDashboardData().finally(() => {
            setTimeout(() => $icon.removeClass('animate-spin'), 500);
        });
    });
}

function setActiveFilter($activeButton, filterType) {
    const $filterButtons = $('#filterToday, #filterWeek, #filterMonth');
    
    $filterButtons
        .removeClass('bg-indigo-600 text-white')
        .addClass('text-slate-600 hover:bg-slate-100');
    
    $activeButton
        .addClass('bg-indigo-600 text-white')
        .removeClass('text-slate-600 hover:bg-slate-100');
    
    AppState.currentFilter = filterType;
    $('#customRangeContainer').addClass('hidden');
}

function toggleCustomRangeFields() {
    const $container = $('#customRangeContainer');
    const $filterButtons = $('#filterToday, #filterWeek, #filterMonth');
    
    $container.toggleClass('hidden');
    
    if (!$container.hasClass('hidden')) {
        $filterButtons
            .removeClass('bg-indigo-600 text-white')
            .addClass('text-slate-600 hover:bg-slate-100');
        
        AppState.currentFilter = 'custom';
        $('#dateFrom').focus();
    }
}

function applyDateFilter(filterType) {
    loadDashboardData(filterType);
}

function applyCustomDateRange() {
    const startDate = $('#dateFrom').val();
    const endDate = $('#dateTo').val();
    
    if (!startDate || !endDate) {
        showNotification('Please select both start and end dates', 'error');
        return;
    }
    
    if (new Date(startDate) > new Date(endDate)) {
        showNotification('Start date cannot be after end date', 'error');
        return;
    }
    
    AppState.customDateRange = { from: startDate, to: endDate };
    fetchDashboardData('custom', startDate, endDate);
    showNotification('Custom date range applied', 'success');
}

function setDefaultDates() {
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    $('#dateFrom').val(formatDate(weekAgo));
    $('#dateTo').val(formatDate(today));
}

// ============================================
// DATA LOADING & API CALLS
// ============================================

function loadDashboardData(filter) {
    AppState.isLoading = true;
    showLoadingState(true);
    
    fetchDashboardData(filter)
        .finally(() => {
            AppState.isLoading = false;
            showLoadingState(false);
        });
}

function refreshDashboardData() {
    const filter = AppState.currentFilter;
    const { from, to } = AppState.customDateRange;
    
    AppState.isLoading = true;
    showLoadingState(true);
    
    return fetchDashboardData(filter, from, to)
        .finally(() => {
            AppState.isLoading = false;
            showLoadingState(false);
        });
}

function showLoadingState(isLoading) {
    if (isLoading) {
        $('#kpiSection, #transactionsTable').addClass('opacity-50 pointer-events-none');
        $('#transactionCount').text('Loading...');
    } else {
        $('#kpiSection, #transactionsTable').removeClass('opacity-50 pointer-events-none');
    }
}

function fetchDashboardData(filter, startDate, endDate) {
    let url = `${WEB_APP_URL}?action=getData&filter=${filter}`;
    
    if (filter === 'custom' && startDate && endDate) {
        url += `&start=${startDate}&end=${endDate}`;
    }
    
    return fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                updateDashboard(data);
                AppState.transactions = data.tableData || [];
            } else {
                throw new Error(data.message || 'Failed to fetch data');
            }
            return data;
        })
        .catch(error => {
            console.error('Fetch error:', error);
            showNotification('Failed to load dashboard data', 'error');
            throw error;
        });
}

function loadPartnersAndLocations() {
    return fetch(`${WEB_APP_URL}?action=getPartnersAndLocations`)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                AppState.partners = data.partners || [];
                AppState.locations = data.locations || [];
            } else {
                throw new Error(data.message || 'Failed to load data');
            }
            return data;
        });
}

function loadUsedPartnersForDate(date) {
    return fetch(`${WEB_APP_URL}?action=getUsedPartnersForDate&date=${date}`)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                AppState.usedPartnersToday = data.usedPartners || [];
            }
            return data;
        })
        .catch(error => {
            console.error('Error loading used partners:', error);
            AppState.usedPartnersToday = [];
        });
}

function fetchPartners() {
    return fetch(`${WEB_APP_URL}?action=getPartners`)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                AppState.partners = data.partners || [];
                return data.partners;
            }
            throw new Error(data.message);
        });
}

function fetchLocations() {
    return fetch(`${WEB_APP_URL}?action=getLocations`)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                AppState.locations = data.locations || [];
                return data.locations;
            }
            throw new Error(data.message);
        });
}

function savePartnerToSheet(name) {
    return fetch(WEB_APP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'addPartner', name: name })
    }).then(response => response.json());
}

function saveLocationToSheet(name) {
    return fetch(WEB_APP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'addLocation', name: name })
    }).then(response => response.json());
}

function deletePartnerFromSheet(name) {
    return fetch(WEB_APP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'deletePartner', name: name })
    }).then(response => response.json());
}

function deleteLocationFromSheet(name) {
    return fetch(WEB_APP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'deleteLocation', name: name })
    }).then(response => response.json());
}

function submitEntries(entries) {
    return fetch(WEB_APP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'addEntries', entries: entries })
    }).then(response => response.json());
}

function deleteEntryFromSheet(identifier) {
    return fetch(WEB_APP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'deleteEntry', rowNumber: identifier })
    }).then(response => response.json());
}

// ============================================
// DASHBOARD UPDATE
// ============================================

function updateDashboard(data) {
    if (data.summary) {
        updateKPICards(data.summary);
    }
    
    if (data.tableData) {
        updateTransactionsTable(data.tableData);
    }
}

function updateKPICards(summary) {
    $('#totalTrucks').text(summary.totalTrucks.toLocaleString());
    $('#revenuePaid').text(formatNumber(summary.totalPaid) + '৳');
    $('#outstandingAmount').text(formatNumber(summary.totalOutstanding) + '৳');
}

function updateTransactionsTable(transactions) {
    const $tbody = $('#transactionsBody');
    $tbody.empty();
    
    if (!transactions || transactions.length === 0) {
        $tbody.append(`
            <tr id="emptyStateRow">
                <td colspan="7" class="px-6 py-12 text-center">
                    <div class="flex flex-col items-center">
                        <div class="bg-slate-100 rounded-full p-4 mb-4">
                            <svg class="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                            </svg>
                        </div>
                        <p class="text-slate-600 font-medium mb-1">No transactions found</p>
                        <p class="text-sm text-slate-400">Add your first entry to get started</p>
                    </div>
                </td>
            </tr>
        `);
        $('#transactionCount').text('0 entries');
        return;
    }
    
    const avatarColors = [
        'bg-indigo-100 text-indigo-600',
        'bg-purple-100 text-purple-600',
        'bg-blue-100 text-blue-600',
        'bg-cyan-100 text-cyan-600',
        'bg-teal-100 text-teal-600',
        'bg-emerald-100 text-emerald-600',
        'bg-amber-100 text-amber-600',
        'bg-orange-100 text-orange-600',
        'bg-rose-100 text-rose-600',
        'bg-pink-100 text-pink-600'
    ];
    
    transactions.forEach((tx, index) => {
        const initials = getInitials(tx.partner);
        const isOutstanding = tx.status === 'Outstanding';
        const avatarColor = avatarColors[index % avatarColors.length];
        
        const rowClass = isOutstanding ? 'bg-rose-50/50 hover:bg-rose-50' : 'hover:bg-slate-50';
        const statusBgClass = isOutstanding ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700';
        const statusDotClass = isOutstanding ? 'bg-rose-500' : 'bg-emerald-500';
        
        const formattedAmount = tx.formattedAmount || (formatNumber(tx.amount) + '৳');
        const formattedDate = tx.formattedDate || formatDisplayDate(tx.date);
        const route = (tx.from && tx.to) ? `${tx.from} → ${tx.to}` : (tx.from || tx.to || '-');
        
        const rowHtml = `
            <tr class="${rowClass} transition-colors duration-150">
                <td class="px-4 py-4 text-sm text-slate-500 whitespace-nowrap">${escapeHtml(formattedDate)}</td>
                <td class="px-4 py-4">
                    <div class="flex items-center">
                        <div class="w-8 h-8 ${avatarColor} rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                            <span class="text-xs font-bold">${escapeHtml(initials)}</span>
                        </div>
                        <span class="font-medium text-slate-800 truncate max-w-[150px]">${escapeHtml(tx.partner)}</span>
                    </div>
                </td>
                <td class="px-4 py-4 text-sm text-slate-600 max-w-[200px] truncate" title="${escapeHtml(route)}">${escapeHtml(route)}</td>
                <td class="px-4 py-4 text-center text-slate-600 font-medium">${tx.truckCount}</td>
                <td class="px-4 py-4 text-right text-slate-800 font-bold">${formattedAmount}</td>
                <td class="px-4 py-4 text-center">
                    <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${statusBgClass}">
                        <span class="w-1.5 h-1.5 ${statusDotClass} rounded-full mr-1.5"></span>
                        ${tx.status}
                    </span>
                </td>
                <td class="px-4 py-4 text-center">
                    <div class="flex items-center justify-center gap-2">
                        <button class="edit-entry-btn p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" 
                                data-row="${tx.rowNumber}" data-rowid="${escapeHtml(tx.rowId || '')}">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                            </svg>
                        </button>
                        <button class="delete-entry-btn p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors" 
                                data-row="${tx.rowNumber}" data-rowid="${escapeHtml(tx.rowId || '')}">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>
        `;
        
        $tbody.append(rowHtml);
    });
    
    const count = transactions.length;
    $('#transactionCount').text(`${count} ${count === 1 ? 'entry' : 'entries'}`);
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatDisplayDate(dateString) {
    if (!dateString) return '';
    const parts = dateString.split('-');
    if (parts.length !== 3) return dateString;
    const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatNumber(num) {
    if (typeof num !== 'number') num = parseFloat(num) || 0;
    return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function getInitials(name) {
    if (!name) return '??';
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) {
        return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showNotification(message, type = 'info') {
    $('.notification-toast').remove();
    
    const colors = {
        success: 'bg-emerald-500',
        error: 'bg-rose-500',
        warning: 'bg-amber-500',
        info: 'bg-indigo-500'
    };
    
    const icons = {
        success: 'M5 13l4 4L19 7',
        error: 'M6 18L18 6M6 6l12 12',
        warning: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
        info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
    };
    
    const $notification = $(`
        <div class="notification-toast fixed top-20 right-4 z-[100] flex items-center px-4 py-3 rounded-lg shadow-lg ${colors[type]} text-white transform translate-x-full transition-all duration-300 ease-out max-w-sm">
            <svg class="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${icons[type]}"></path>
            </svg>
            <span class="font-medium text-sm">${escapeHtml(message)}</span>
            <button class="ml-4 text-white/80 hover:text-white flex-shrink-0 notification-close">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </button>
        </div>
    `);
    
    $('body').append($notification);
    
    $notification.find('.notification-close').on('click', function() {
        $notification.addClass('translate-x-full opacity-0');
        setTimeout(() => $notification.remove(), 300);
    });
    
    setTimeout(() => $notification.removeClass('translate-x-full'), 10);
    
    setTimeout(() => {
        $notification.addClass('translate-x-full opacity-0');
        setTimeout(() => $notification.remove(), 300);
    }, 4000);
}

// ============================================
// DEBUG HELPERS
// ============================================

window.TruckFlow = {
    state: AppState,
    refreshDashboardData,
    showNotification,
    loadPartnersAndLocations,
    
    testAPI: function() {
        fetch(`${WEB_APP_URL}?action=getPartnersAndLocations`)
            .then(r => r.json())
            .then(d => {
                console.log('API Test Result:', d);
                showNotification('API connection successful!', 'success');
            })
            .catch(e => {
                console.error('API Error:', e);
                showNotification('API connection failed', 'error');
            });
    }
};

console.log('🛠 TruckFlow Debug: Access via window.TruckFlow');
console.log('   TruckFlow.testAPI() - Test API connection');
console.log('   TruckFlow.state - View current state');