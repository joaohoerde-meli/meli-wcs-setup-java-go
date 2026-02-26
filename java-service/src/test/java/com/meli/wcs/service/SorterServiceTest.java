package com.meli.wcs.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.meli.wcs.dto.SorterDetail;
import com.meli.wcs.dto.SorterSummary;
import com.meli.wcs.dto.TopologyPayload;
import com.meli.wcs.model.Sorter;
import com.meli.wcs.repository.SorterRepository;
import com.meli.wcs.validation.TopologyValidator;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SorterServiceTest {

    @Mock
    SorterRepository repository;

    @Mock
    TopologyValidator validator;

    @Spy
    ObjectMapper objectMapper;

    @InjectMocks
    SorterService service;

    // ── listSorters ───────────────────────────────────────────────────────────

    @Test
    void listSorters_noSorters_returnsEmptyList() {
        when(repository.findAll()).thenReturn(List.of());
        assertThat(service.listSorters()).isEmpty();
    }

    @Test
    void listSorters_withSorters_returnsSummaries() {
        when(repository.findAll()).thenReturn(List.of(buildSorter("SORTER-01")));
        List<SorterSummary> result = service.listSorters();
        assertThat(result).hasSize(1);
        assertThat(result.get(0).sorterId()).isEqualTo("SORTER-01");
    }

    // ── getSorter ─────────────────────────────────────────────────────────────

    @Test
    void getSorter_exists_returnsDetail() {
        when(repository.findBySorterId("SORTER-01")).thenReturn(Optional.of(buildSorter("SORTER-01")));
        SorterDetail result = service.getSorter("SORTER-01");
        assertThat(result.sorterId()).isEqualTo("SORTER-01");
    }

    @Test
    void getSorter_notFound_throws404() {
        when(repository.findBySorterId("UNKNOWN")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.getSorter("UNKNOWN"))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode().value())
                        .isEqualTo(HttpStatus.NOT_FOUND.value()));
    }

    // ── createSorter ──────────────────────────────────────────────────────────

    @Test
    void createSorter_success_savesEntity() {
        TopologyPayload payload = buildPayload("SORTER-01", "Test Sorter");
        when(repository.existsBySorterId("SORTER-01")).thenReturn(false);
        when(repository.save(any())).thenAnswer(inv -> {
            Sorter s = inv.getArgument(0);
            s.setCreatedAt(LocalDateTime.now());
            s.setUpdatedAt(LocalDateTime.now());
            return s;
        });

        SorterDetail result = service.createSorter(payload);

        assertThat(result.sorterId()).isEqualTo("SORTER-01");
        assertThat(result.sorterName()).isEqualTo("Test Sorter");
        verify(validator).validate(payload);
        verify(repository).save(any(Sorter.class));
    }

    @Test
    void createSorter_duplicateSorterId_throwsConflict() {
        TopologyPayload payload = buildPayload("SORTER-01", "Dup");
        when(repository.existsBySorterId("SORTER-01")).thenReturn(true);

        assertThatThrownBy(() -> service.createSorter(payload))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode().value())
                        .isEqualTo(HttpStatus.CONFLICT.value()));
    }

    // ── updateTopology ────────────────────────────────────────────────────────

    @Test
    void updateTopology_exists_updatesFields() {
        Sorter existing = buildSorter("SORTER-01");
        TopologyPayload payload = buildPayload("SORTER-01", "Updated Name");
        when(repository.findBySorterId("SORTER-01")).thenReturn(Optional.of(existing));
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        SorterDetail result = service.updateTopology("SORTER-01", payload);

        assertThat(result.sorterName()).isEqualTo("Updated Name");
        verify(validator).validate(payload);
    }

    @Test
    void updateTopology_notFound_throws404() {
        when(repository.findBySorterId("MISSING")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.updateTopology("MISSING", buildPayload("MISSING", "x")))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode().value())
                        .isEqualTo(HttpStatus.NOT_FOUND.value()));
    }

    // ── deleteSorter ──────────────────────────────────────────────────────────

    @Test
    void deleteSorter_exists_deletesEntity() {
        Sorter sorter = buildSorter("SORTER-01");
        when(repository.findBySorterId("SORTER-01")).thenReturn(Optional.of(sorter));

        service.deleteSorter("SORTER-01");

        verify(repository).delete(sorter);
    }

    @Test
    void deleteSorter_notFound_throws404() {
        when(repository.findBySorterId("GHOST")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.deleteSorter("GHOST"))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode().value())
                        .isEqualTo(HttpStatus.NOT_FOUND.value()));
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private TopologyPayload buildPayload(String sorterId, String sorterName) {
        return new TopologyPayload(sorterId, sorterName, objectMapper.createObjectNode(),
                List.of(), List.of());
    }

    private Sorter buildSorter(String sorterId) {
        return Sorter.builder()
                .id("abc123def456")
                .sorterId(sorterId)
                .sorterName("Test Sorter")
                .constraints("{}")
                .nodes("[]")
                .edges("[]")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }
}
