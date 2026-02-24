package com.meli.wcs.repository;

import com.meli.wcs.model.Sorter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SorterRepository extends JpaRepository<Sorter, String> {

    Optional<Sorter> findBySorterId(String sorterId);

    boolean existsBySorterId(String sorterId);
}
